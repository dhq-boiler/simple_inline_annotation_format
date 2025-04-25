# SimpleInlineTextAnnotation (Ruby gem)

`SimpleInlineTextAnnotation` is a Ruby gem designed for working with inline text annotations. It allows you to parse and generate annotated text in a structured and efficient way.

## Installation

To use this gem in a Rails application, add the following line to your application's `Gemfile`:

```ruby
gem 'simple_inline_text_annotation'
```

Then, run the following command to install the gem:

```bash
bundle install
```

## Usage

The `SimpleInlineTextAnnotation` gem provides two main methods: `parse` and `generate`. These methods allow you to work with inline text annotations in a structured way.

### `parse` Method

The `parse` method takes a string with inline annotations and extracts structured information about the annotations, including the character positions and annotation types.

#### Example

```ruby
result = SimpleInlineTextAnnotation.parse('[Elon Musk][Person] is a member of the [PayPal Mafia][Organization].')
puts result
# => {
#      text: "Elon Musk is a member of the PayPal Mafia.",
#      denotations: [
#        {span: {begin: 0, end: 9}, obj: "Person"},
#        {span: {begin: 29, end: 41}, obj: "Organization"}
#      ]
#    }
```

#### Explanation

- The input string `[Elon Musk][Person] is a member of the [PayPal Mafia][Organization].` contains two annotations:
  1. `[Elon Musk][Person]`: The text `Elon Musk` is annotated as `Person`.
  2. `[PayPal Mafia][Organization]`: The text `PayPal Mafia` is annotated as `Organization`.

- The method returns a hash with:
  - `"text"`: The plain text without annotations.
  - `"denotations"`: An array of hashes, where each hash contains:
    - `"span"`: The character positions (`begin` and `end`) of the annotated text.
    - `"obj"`: The annotation type.

### `generate` Method

The `generate` method performs the reverse operation of `parse`. It takes a hash containing the plain text and its annotations, and generates a string with inline annotations.

#### Example

```ruby
result = SimpleInlineTextAnnotation.generate({
  "text" => "Elon Musk is a member of the PayPal Mafia.",
  "denotations" => [
    { "span" => { "begin" => 0, "end" => 9 }, "obj" => "Person" },
    { "span" => { "begin" => 29, "end" => 41 }, "obj" => "Organization" }
  ]
})
puts result
# => "[Elon Musk][Person] is a member of the [PayPal Mafia][Organization]."
```

#### Explanation

- The input hash contains:
  - `"text"`: The plain text (`"Elon Musk is a member of the PayPal Mafia."`).
  - `"denotations"`: An array of hashes, where each hash specifies:
    - `"span"`: The character positions (`begin` and `end`) of the annotated text.
    - `"obj"`: The annotation type.
- The method generates a string where:
  - The text specified in `"span"` is enclosed in square brackets `[]`.
  - The annotation type specified in `"obj"` is added in a second set of square brackets `[]`.

## Relation Notation

The `SimpleInlineTextAnnotation` gem supports advanced relation notation, allowing you to define relationships between annotated entities. This is achieved by interpreting the second set of square brackets (`[]`) based on the number of elements it contains.

#### Parsing Rules

- If the second `[]` contains **1 element**, it is treated as the annotation type (default behavior).
- If the second `[]` contains **2 elements**, the first element is interpreted as the `id` of the denotation, and the second element as the `obj` (annotation type).
- If the second `[]` contains **4 elements**, the elements are interpreted as follows:
  1. The first element is the `id` of the denotation and the `subj` of the relation.
  2. The second element is the `obj` (annotation type) of the denotation.
  3. The third element is the `pred` (predicate) of the relation.
  4. The fourth element is the `obj` of the relation.
- Any other cases are ignored.

### Example

```ruby
source = "[Elon Musk][T1, Person, member_of, T2] is a member of the [PayPal Mafia][T2, Organization]."
result = SimpleInlineTextAnnotation.parse(source)
puts result
# => {
#      text: "Elon Musk is a member of the PayPal Mafia.",
#      denotations: [
#        { id: "T1", span: { begin: 0, end: 9 }, obj: "Person" },
#        { id: "T2", span: { begin: 29, end: 41 }, obj: "Organization" }
#      ],
#      relations: [
#        { pred: "member_of", subj: "T1", obj: "T2" }
#      ]
#    }
```

### Explanation

- The input string `[Elon Musk][T1, Person, member_of, T2] is a member of the [PayPal Mafia][T2, Organization].` contains:
  1. Two denotations:
     - `[Elon Musk][T1, Person, member_of, T2]`: The text `Elon Musk` is annotated as `Person` with `id` `T1`. It also serves as the `subj` of the relation.
     - `[PayPal Mafia][T2, Organization]`: The text `PayPal Mafia` is annotated as `Organization` with `id` `T2`.
  2. One relation:
     - `member_of`: Indicates that `T1` (`Elon Musk`) is a member of `T2` (`PayPal Mafia`).

- The method returns a hash with:
  - `"text"`: The plain text without annotations.
  - `"denotations"`: An array of hashes, where each hash contains:
    - `"id"`: The unique identifier of the denotation.
    - `"span"`: The character positions (`begin` and `end`) of the annotated text.
    - `"obj"`: The annotation type.
  - `"relations"`: An array of hashes, where each hash contains:
    - `"pred"`: The predicate or type of the relation.
    - `"subj"`: The `id` of the subject denotation.
    - `"obj"`: The `id` of the object denotation.

### Generating Relation Notation

The `generate` method can also create strings with relation notations from structured data.

```ruby
result = SimpleInlineTextAnnotation.generate({
  "text" => "Elon Musk is a member of the PayPal Mafia.",
  "denotations" => [
    { "id" => "T1", "span" => { "begin" => 0, "end" => 9 }, "obj" => "Person" },
    { "id" => "T2", "span" => { "begin" => 29, "end" => 41 }, "obj" => "Organization" }
  ],
  "relations" => [
    { "pred" => "member_of", "subj" => "T1", "obj" => "T2" }
  ]
})
puts result
# => "[Elon Musk][T1, Person, member_of, T2] is a member of the [PayPal Mafia][T2, Organization]."
```

#### Explanation

- The input hash includes:
  - `"text"`: The plain text.
  - `"denotations"`: An array of annotations with `id`, `span`, and `obj`.
  - `"relations"`: An array of relationships, where:
    - `"subj"` and `"obj"` reference `id`s in the `denotations` array.
    - `"pred"` specifies the relationship type.
- The method generates a string with inline annotations and relationships.
