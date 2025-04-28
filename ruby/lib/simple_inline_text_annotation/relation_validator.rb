# frozen_string_literal: true

class SimpleInlineTextAnnotation
  module RelationValidator
    def validate_relations(relations)
      remove_incomplete_key_relations(relations)
    end

    private

    def remove_incomplete_key_relations(relations)
      relations.select { |relation| relation["subj"] && relation["pred"] && relation["obj"] }
    end
  end
end
