# frozen_string_literal: true

require_relative "denotation"
require_relative "relation_validator"

class SimpleInlineTextAnnotation
  class Generator
    include DenotationValidator
    include RelationValidator

    def initialize(source)
      @source = source.dup.freeze
      @denotations = build_denotations(source["denotations"] || [])
      @config = @source["config"]
    end

    def generate
      text = @source["text"]
      raise SimpleInlineTextAnnotation::GeneratorError, 'The "text" key is missing.' if text.nil?

      denotations = validate_denotations(@denotations, text.length)

      annotated_text = annotate_text(text, denotations)
      label_definitions = build_label_definitions

      [annotated_text, label_definitions].compact.join("\n\n")
    end

    private

    def build_denotations(denotations)
      denotations.map { |d| Denotation.new(d["span"]["begin"], d["span"]["end"], d["obj"], d["id"]) }
    end

    def annotate_text(text, denotations)
      # Annotate text from the end to ensure position calculation.
      denotations.sort_by(&:begin_pos).reverse_each do |denotation|
        text = annotate_text_with_denotation(text, denotation)
      end

      text
    end

    def annotate_text_with_denotation(text, denotation)
      begin_pos = denotation.begin_pos
      end_pos = denotation.end_pos
      annotation = if denotation.id && !denotation.id.empty?
                     get_annotations(denotation)
                   else
                     get_obj(denotation.obj)
                   end

      annotated_text = "[#{text[begin_pos...end_pos]}][#{annotation}]"
      text[0...begin_pos] + annotated_text + text[end_pos..]
    end

    def labeled_entity_types
      return nil unless @config

      @config["entity types"]&.select { |entity_type| entity_type.key?("label") }
    end

    def get_annotations(denotation)
      relation = find_valid_relation(denotation.id)
      annotations = [denotation.id, denotation.obj, relation&.dig("pred"), relation&.dig("obj")]

      return annotations.compact.join(", ") unless labeled_entity_types

      annotations[1] = get_obj(denotation.obj)
      annotations.compact.join(", ")
    end

    def find_valid_relation(denotation_id)
      relations = validate_relations(@source["relations"] || [])
      relations.find { |rel| rel["subj"] == denotation_id }
    end

    def get_obj(obj)
      return obj unless labeled_entity_types

      entity = labeled_entity_types.find { |entity_type| entity_type["id"] == obj }
      entity ? entity["label"] : obj
    end

    def build_label_definitions
      return nil if labeled_entity_types.nil? || labeled_entity_types.empty?

      labeled_entity_types.map do |entity|
        "[#{entity["label"]}]: #{entity["id"]}"
      end.join("\n")
    end
  end
end
