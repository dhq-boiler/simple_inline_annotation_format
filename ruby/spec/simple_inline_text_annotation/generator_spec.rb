# frozen_string_literal: true

require "spec_helper"

RSpec.describe SimpleInlineTextAnnotation::Generator, type: :model do
  describe "#generate" do
    subject { SimpleInlineTextAnnotation.generate(source) }

    context "when source has denotations" do
      let(:source) do
        {
          "text" => "Elon Musk is a member of the PayPal Mafia.",
          "denotations" => [
            { "span" => { "begin" => 0, "end" => 9 }, "obj" => "Person" },
            { "span" => { "begin" => 29, "end" => 41 }, "obj" => "Organization" }
          ]
        }
      end
      let(:expected_format) do
        "[Elon Musk][Person] is a member of the [PayPal Mafia][Organization]."
      end

      it "generate annotation structure" do
        is_expected.to eq(expected_format)
      end
    end

    context "when source has config" do
      let(:source) do
        {
          "text" => "Elon Musk is a member of the PayPal Mafia.",
          "denotations" => [
            { "span" => { "begin" => 0, "end" => 9 }, "obj" => "https://example.com/Person" },
            { "span" => { "begin" => 29, "end" => 41 }, "obj" => "https://example.com/Organization" }
          ],
          "config" => {
            "entity types" => [
              { "id" => "https://example.com/Person", "label" => "Person" },
              { "id" => "https://example.com/Organization", "label" => "Organization" }
            ]
          }
        }
      end
      let(:expected_format) do
        <<~MD2.chomp
          [Elon Musk][Person] is a member of the [PayPal Mafia][Organization].

          [Person]: https://example.com/Person
          [Organization]: https://example.com/Organization
        MD2
      end

      it "generate label definition structure" do
        is_expected.to eq(expected_format)
      end
    end

    context "when source has denotations with ids but no relations" do
      let(:source) do
        {
          "text" => "Elon Musk is a member of the PayPal Mafia.",
          "denotations" => [
            { "id" => "T1", "span" => { "begin" => 0, "end" => 9 }, "obj" => "Person" },
            { "id" => "T2", "span" => { "begin" => 29, "end" => 41 }, "obj" => "Organization" }
          ]
        }
      end
      let(:expected_format) do
        "[Elon Musk][T1, Person] is a member of the [PayPal Mafia][T2, Organization]."
      end

      it "displays ids in annotations even without relations" do
        is_expected.to eq(expected_format)
      end
    end

    context "when source has denotations and relations" do
      let(:source) do
        {
          "text" => "Elon Musk is a member of the PayPal Mafia.",
          "denotations" => [
            { "id" => "T1", "span" => { "begin" => 0, "end" => 9 }, "obj" => "Person" },
            { "id" => "T2", "span" => { "begin" => 29, "end" => 41 }, "obj" => "Organization" }
          ],
          "relations" => [
            { "subj" => "T1", "pred" => "member_of", "obj" => "T2" }
          ]
        }
      end
      let(:expected_format) do
        "[Elon Musk][T1, Person, member_of, T2] is a member of the " \
        "[PayPal Mafia][T2, Organization]."
      end

      it "generate annotation structure" do
        is_expected.to eq(expected_format)
      end
    end

    context "when source includes entity config and relations" do
      let(:source) do
        {
          "text" => "Elon Musk is a member of the PayPal Mafia.",
          "denotations" => [
            { "id" => "T1", "span" => { "begin" => 0, "end" => 9 }, "obj" => "https://example.com/Person" },
            { "id" => "T2", "span" => { "begin" => 29, "end" => 41 }, "obj" => "https://example.com/Organization" }
          ],
          "relations" => [
            { "subj" => "T1", "pred" => "member_of", "obj" => "T2" }
          ],
          "config" => {
            "entity types" => [
              { "id" => "https://example.com/Person", "label" => "Person" },
              { "id" => "https://example.com/Organization", "label" => "Organization" }
            ]
          }
        }
      end
      let(:expected_format) do
        <<~MD2.chomp
          [Elon Musk][T1, Person, member_of, T2] is a member of the [PayPal Mafia][T2, Organization].

          [Person]: https://example.com/Person
          [Organization]: https://example.com/Organization
        MD2
      end

      it "generate label definition structure" do
        is_expected.to eq(expected_format)
      end
    end

    context "when entity type has present but label is missing" do
      let(:source) do
        {
          "text" => "Elon Musk is a member of the PayPal Mafia.",
          "denotations" => [
            { "id" => "T1", "span" => { "begin" => 0, "end" => 9 }, "obj" => "Person" }
          ],
          "relations" => [
            { "subj" => "T1", "pred" => "member_of", "obj" => "T2" }
          ],
          "config" => {
            "entity types" => [
              { "id" => "Person" }
            ]
          }
        }
      end

      let(:expected_format) { "[Elon Musk][T1, Person, member_of, T2] is a member of the PayPal Mafia." }

      it "should create only annotation structure" do
        is_expected.to eq(expected_format)
      end
    end

    context "when denotation is missing" do
      let(:source) do
        {
          "text" => "Elon Musk is a member of the PayPal Mafia.",
          "denotations" => []
        }
      end
      let(:expected_format) { "Elon Musk is a member of the PayPal Mafia." }

      it "does not generate any denotation" do
        is_expected.to eq(expected_format)
      end
    end

    context "when span value is not integer" do
      let(:source) do
        {
          "text" => "Elon Musk is a member of the PayPal Mafia.",
          "denotations" => [
            { "span" => { "begin" => 0.1, "end" => 9.6 }, "obj" => "Person" }
          ]
        }
      end

      let(:expected_format) { "Elon Musk is a member of the PayPal Mafia." }

      it "should not parse as annotation" do
        is_expected.to eq(expected_format)
      end
    end

    context "when source has same span denotations" do
      let(:source) do
        {
          "text" => "Elon Musk is a member of the PayPal Mafia.",
          "denotations" => [
            { "span" => { "begin" => 0, "end" => 9 }, "obj" => "Person" },
            { "span" => { "begin" => 0, "end" => 9 }, "obj" => "Organization" }
          ]
        }
      end
      let(:expected_format) { "[Elon Musk][Person] is a member of the PayPal Mafia." }

      it "should use first denotation" do
        is_expected.to eq(expected_format)
      end
    end

    context "when source has nested span within another span" do
      context "when both begin and end are inside" do
        let(:source) do
          {
            "text" => "Elon Musk is a member of the PayPal Mafia.",
            "denotations" => [
              { "span" => { "begin" => 0, "end" => 9 }, "obj" => "Person" },
              { "span" => { "begin" => 2, "end" => 6 }, "obj" => "Organization" }
            ]
          }
        end
        let(:expected_format) { "[Elon Musk][Person] is a member of the PayPal Mafia." }

        it "should use only outer denotation" do
          is_expected.to eq(expected_format)
        end
      end

      context "when begin is inside" do
        let(:source) do
          {
            "text" => "Elon Musk is a member of the PayPal Mafia.",
            "denotations" => [
              { "span" => { "begin" => 0, "end" => 4 }, "obj" => "First name" },
              { "span" => { "begin" => 0, "end" => 9 }, "obj" => "Full name" }
            ]
          }
        end
        let(:expected_format) { "[Elon Musk][Full name] is a member of the PayPal Mafia." }

        it "should use only outer denotation" do
          is_expected.to eq(expected_format)
        end
      end

      context "when end is inside" do
        let(:source) do
          {
            "text" => "Elon Musk is a member of the PayPal Mafia.",
            "denotations" => [
              { "span" => { "begin" => 6, "end" => 9 }, "obj" => "Last name" },
              { "span" => { "begin" => 0, "end" => 9 }, "obj" => "Full name" }
            ]
          }
        end
        let(:expected_format) { "[Elon Musk][Full name] is a member of the PayPal Mafia." }

        it "should use only outer denotation" do
          is_expected.to eq(expected_format)
        end
      end
    end

    context "when source has boundary-crossing denotations" do
      let(:source) do
        {
          "text" => "Elon Musk is a member of the PayPal Mafia.",
          "denotations" => [
            { "span" => { "begin" => 0, "end" => 9 }, "obj" => "Person" },
            { "span" => { "begin" => 8, "end" => 11 }, "obj" => "Organization" }
          ]
        }
      end
      let(:expected_format) { "Elon Musk is a member of the PayPal Mafia." }

      it "should be both ignored" do
        is_expected.to eq(expected_format)
      end
    end

    context "when denotations span is negative" do
      let(:source) do
        {
          "text" => "Elon Musk is a member of the PayPal Mafia.",
          "denotations" => [
            { "span" => { "begin" => -1, "end" => 9 }, "obj" => "Person" }
          ]
        }
      end
      let(:expected_format) { "Elon Musk is a member of the PayPal Mafia." }

      it "should be ignored" do
        is_expected.to eq(expected_format)
      end
    end

    context "when denotations span is invalid" do
      let(:source) do
        {
          "text" => "Elon Musk is a member of the PayPal Mafia.",
          "denotations" => [
            { "span" => { "begin" => 4, "end" => 0 }, "obj" => "Person" }
          ]
        }
      end
      let(:expected_format) { "Elon Musk is a member of the PayPal Mafia." }

      it "should be ignored" do
        is_expected.to eq(expected_format)
      end
    end

    context "when denotation is out of bound with text length" do
      let(:source) do
        {
          "text" => "Elon Musk is a member of the PayPal Mafia.",
          "denotations" => [
            { "span" => { "begin" => 100, "end" => 200 }, "obj" => "Person" }
          ]
        }
      end
      let(:expected_format) { "Elon Musk is a member of the PayPal Mafia." }

      it "should be ignored" do
        is_expected.to eq(expected_format)
      end
    end

    context "with relation" do
      context "when subject is invalid and relation exists" do
        let(:source) do
          {
            "text" => "Elon Musk is a member of the PayPal Mafia.",
            "denotations" => [
              { "id" => "T1", "span" => { "begin" => 0.1, "end" => 9.6 }, "obj" => "Person" }
            ],
            "relations" => [
              { "subj" => "T1", "pred" => "member_of", "obj" => "T2" }
            ]
          }
        end

        let(:expected_format) { "Elon Musk is a member of the PayPal Mafia." }

        it "ignores the invalid denotation and its relation" do
          is_expected.to eq(expected_format)
        end
      end

      context "when subject does not exist" do
        let(:source) do
          {
            "text" => "Elon Musk is a member of the PayPal Mafia.",
            "denotations" => [
              { "id" => "T2", "span" => { "begin" => 29, "end" => 41 }, "obj" => "Organization" }
            ],
            "relations" => [
              { "subj" => "T1", "pred" => "member_of", "obj" => "T2" }
            ]
          }
        end
        let(:expected_format) { "Elon Musk is a member of the [PayPal Mafia][T2, Organization]." }

        it "does not generate the relation due to subject does not exist" do
          is_expected.to eq(expected_format)
        end
      end

      context "when both subject and object do not exist" do
        let(:source) do
          {
            "text" => "Elon Musk is a member of the PayPal Mafia.",
            "denotations" => [],
            "relations" => [
              { "subj" => "T1", "pred" => "member_of", "obj" => "T2" }
            ]
          }
        end
        let(:expected_format) { "Elon Musk is a member of the PayPal Mafia." }

        it "does not generate the relation because both subject and object do not exist" do
          is_expected.to eq(expected_format)
        end
      end

      context "when relation keys are missing" do
        context "when subj is missing" do
          let(:source) do
            {
              "text" => "Elon Musk is a member of the PayPal Mafia.",
              "denotations" => [
                { "id" => "T1", "span" => { "begin" => 0, "end" => 9 }, "obj" => "Person" },
                { "id" => "T2", "span" => { "begin" => 29, "end" => 41 }, "obj" => "Organization" }
              ],
              "relations" => [
                { "pred" => "member_of", "obj" => "T2" }
              ]
            }
          end
          let(:expected_format) { "[Elon Musk][T1, Person] is a member of the [PayPal Mafia][T2, Organization]." }

          it "does not generate the relation" do
            is_expected.to eq(expected_format)
          end
        end

        context "when pred is missing" do
          let(:source) do
            {
              "text" => "Elon Musk is a member of the PayPal Mafia.",
              "denotations" => [
                { "id" => "T1", "span" => { "begin" => 0, "end" => 9 }, "obj" => "Person" },
                { "id" => "T2", "span" => { "begin" => 29, "end" => 41 }, "obj" => "Organization" }
              ],
              "relations" => [
                { "subj" => "T1", "obj" => "T2" }
              ]
            }
          end
          let(:expected_format) { "[Elon Musk][T1, Person] is a member of the [PayPal Mafia][T2, Organization]." }

          it "does not generate the relation" do
            is_expected.to eq(expected_format)
          end
        end

        context "when obj is missing" do
          let(:source) do
            {
              "text" => "Elon Musk is a member of the PayPal Mafia.",
              "denotations" => [
                { "id" => "T1", "span" => { "begin" => 0, "end" => 9 }, "obj" => "Person" }
              ],
              "relations" => [
                { "subj" => "T1", "pred" => "member_of" }
              ]
            }
          end
          let(:expected_format) { "[Elon Musk][T1, Person] is a member of the PayPal Mafia." }

          it "does not generate the relation" do
            is_expected.to eq(expected_format)
          end
        end
      end
    end

    context "when source text key is missing" do
      let(:source) do
        {
          "denotations" => [
            { "span" => { "begin" => 4, "end" => 0 }, "obj" => "Person" }
          ]
        }
      end

      it "raises GeneratorError" do
        expect { subject }.to raise_error(SimpleInlineTextAnnotation::GeneratorError, 'The "text" key is missing.')
      end
    end
  end
end
