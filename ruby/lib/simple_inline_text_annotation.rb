# frozen_string_literal: true

require_relative "simple_inline_text_annotation/version"
require_relative "simple_inline_text_annotation/generator"
require_relative "simple_inline_text_annotation/parser"

class SimpleInlineTextAnnotation
  # ENTITY_TYPE_PATTERN matches a pair of square brackets which is followed by a colon and URL.
  # Similar to Markdown, this also matches when there is text enclosed in "" or '' after the URL.
  # Match example:
  #  - [Label]: URL
  #  - [Label]: URL "text"
  ENTITY_TYPE_PATTERN = /^\s*\[([^\]]+)\]:\s+(\S+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*$/

  # ENTITY_TYPE_BLOCK_PATTERN matches a block of the entity type definitions.
  # Requires a blank line above the block definition.
  ENTITY_TYPE_BLOCK_PATTERN = /(?:\A|\n\s*\n)((?:#{ENTITY_TYPE_PATTERN}(?:\n|$))+)/

  # ESCAPE_PATTERN matches a backslash (\) preceding two consecutive pairs of square brackets.
  # Example: \[This is a part of][original text]
  ESCAPE_PATTERN = /\\(?=\[[^\]]+\]\[[^\]]+\])/

  def initialize(text, denotations, relations, entity_type_collection)
    @text = text
    @denotations = denotations
    @relations = relations
    @entity_type_collection = entity_type_collection
    check_denotations_and_relations
  end

  def self.parse(source)
    result = SimpleInlineTextAnnotation::Parser.new(source).parse
    result.to_h
  end

  def self.generate(source)
    SimpleInlineTextAnnotation::Generator.new(source).generate
  end

  def to_h
    {
      "text" => format_text(@text),
      "denotations" => @denotations.map(&:to_h),
      "relations" => @relations.empty? ? nil : @relations,
      "config" => config
    }.compact
  end

  private

  def format_text(text)
    result = remove_escape_backslash_from(text)
    reduce_consecutive_newlines_from(result)
  end

  # Remove backslashes used to escape inline annotation format.
  # For example, `\[Elon Musk][Person]` is treated as plain text
  # rather than an annotation. This method removes the leading
  # backslash and keeps the text as `[Elon Musk][Person]`.
  def remove_escape_backslash_from(text)
    text.gsub(ESCAPE_PATTERN, "")
  end

  # Reduce consecutive newlines to a single newline.
  def reduce_consecutive_newlines_from(text)
    text.gsub(/\n{2,}/, "\n\n")
  end

  def config
    return nil unless @entity_type_collection.any?

    { "entity types" => @entity_type_collection.to_config }
  end

  def check_denotations_and_relations
    @relations.each do |relation|
      unless referable_to?(relation, @denotations)
        raise SimpleInlineTextAnnotation::RelationWithoutDenotationError,
              "Relation #{relation.inspect} refers to missing denotation."
      end
    end
  end

  def referable_to?(relation, denotations)
    denotation_ids = denotations.map(&:id)

    denotation_ids.include?(relation["subj"]) && denotation_ids.include?(relation["obj"])
  end
end
