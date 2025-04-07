# frozen_string_literal: true

class SimpleInlineTextAnnotation
  class GeneratorError < StandardError
    def initialize(msg = nil)
      super(msg)
    end
  end
end
