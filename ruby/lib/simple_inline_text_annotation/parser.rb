# frozen_string_literal: true

require_relative "entity_type_collection"
require_relative "denotation"

class SimpleInlineTextAnnotation
  class Parser
    # DENOTATION_PATTERN matches two consecutive pairs of square brackets.
    # Example: [Annotated Text][Label]
    ANNOTATION_PATTERN = /(?<!\\)\[([^\[]+?)\]\[([^\]]+?)\]/

    def initialize(source)
      @source = source.dup.freeze
      @entity_type_collection = EntityTypeCollection.new(source)
    end

    def parse
      @denotations = []
      @relations = []
      full_text = source_without_references

      process_annotations(full_text)

      SimpleInlineTextAnnotation.new(
        full_text,
        @denotations,
        @relations,
        @entity_type_collection
      )
    end

    private

    # Remove references from the source.
    def source_without_references
      @source.gsub(ENTITY_TYPE_BLOCK_PATTERN) do |block|
        block.start_with?("\n\n") ? "\n\n" : ""
      end.strip
    end

    def get_obj_for(label)
      @entity_type_collection.get(label) || label
    end

    def process_annotations(full_text)
      current_pos = 0

      while (match = ANNOTATION_PATTERN.match(full_text, current_pos))
        result = process_single_annotation(match, full_text)
        current_pos = result == :processed ? match.begin(0) + match[1].length : match.end(0)
      end
    end

    def process_single_annotation(match, full_text)
      target_text = match[1]
      begin_pos = match.begin(0)
      end_pos = begin_pos + target_text.length

      return :skipped unless process_annotation_by_size(match[2], begin_pos, end_pos)

      full_text[match.begin(0)...match.end(0)] = target_text
      :processed
    end

    def process_annotation_by_size(annotations, begin_pos, end_pos)
      annotations_array = annotations.split(", ")

      case annotations_array.size
      when 1
        process_denotation(begin_pos, end_pos, annotations_array[0])
      when 2
        process_denotation_with_id(begin_pos, end_pos, annotations_array)
      when 4
        process_denotation_and_relation(begin_pos, end_pos, annotations_array)
      end
    end

    def process_denotation(begin_pos, end_pos, label)
      obj = get_obj_for(label)
      @denotations << Denotation.new(begin_pos, end_pos, obj)
    end

    def process_denotation_with_id(begin_pos, end_pos, annotations)
      id, label = annotations
      obj = get_obj_for(label)
      @denotations << Denotation.new(begin_pos, end_pos, obj, id)
    end

    def process_denotation_and_relation(begin_pos, end_pos, annotations)
      subj, label, pred, obj2 = annotations
      obj = get_obj_for(label)
      @denotations << Denotation.new(begin_pos, end_pos, obj, subj)
      @relations << { pred: pred, subj: subj, obj: obj2 }
    end
  end
end
