# SimpleInlineTextAnnotation (npm package)

`SimpleInlineTextAnnotation` is a JavaScript library designed for working with inline text annotations. It allows you to parse and generate annotated text in a structured and efficient way.

## Installation

To install the library, use npm:

```bash
npm install @pubann/simple-inline-text-annotation
```

## Usage

### Features
- `generate`: Converts Object data into annotated text.
- `parse`: Converts annotated text into structured Object data.

### `parse` Method

The `parse` method takes a string with inline annotations and extracts structured information about the annotations, including the character positions, annotation types, and configuration for entity types.

#### Example

```js
import SimpleInlineTextAnnotation from 'simple-inline-text-annotation'

const result = SimpleInlineTextAnnotation.parse(`[Elon Musk][Person] is a member of the [PayPal Mafia][Organization].

[Person]: https://example.com/Person
[Organization]: https://example.com/Organization`);
console.log(result);
// Output:
// {
//   "text": "Elon Musk is a member of the PayPal Mafia.",
//   "denotations": [
//     { "span": { "begin": 0, "end": 9 }, "obj": "https://example.com/Person" },
//     { "span": { "begin": 29, "end": 41 }, "obj": "https://example.com/Organization" }
//   ],
//   "config": {
//     "entity types": [
//       { "id": "https://example.com/Person", "label": "Person" },
//       { "id": "https://example.com/Organization", "label": "Organization" }
//     ]
//   }
// }
```

#### Explanation

The input string contains inline annotations and references for annotation types:

- `[Elon Musk][Person]`: The text `Elon Musk` is annotated as `Person` with the ID `https://example.com/Person`.
- `[PayPal Mafia][Organization]`: The text `PayPal Mafia` is annotated as `Organization` with the ID `https://example.com/Organization`.

The method returns an object with:

- `"text"`: The plain text without annotations.
  - `"denotations"`: An array of objects, where each object contains:
  - `"span"`: The character positions (`begin` and `end`) of the annotated text.
- `"obj"`: The annotation type (URL or ID).
- `"config"`: Configuration for entity types, including:
  - `"id"`: The unique identifier for the entity type.
  - `"label"`: The human-readable label for the entity type.

### `generate` Method

The `generate` method performs the reverse operation of `parse`. It takes an object containing the plain text, annotations, and configuration, and generates a string with inline annotations and references.

#### Example

```js
import SimpleInlineTextAnnotation from 'simple-inline-text-annotation'

const input = {
  text: "Elon Musk is a member of the PayPal Mafia.",
  denotations: [
    { span: { begin: 0, end: 9 }, obj: "https://example.com/Person" },
    { span: { begin: 29, end: 41 }, obj: "https://example.com/Organization" }
  ],
  config: {
    "entity types": [
      { id: "https://example.com/Person", label: "Person" },
      { id: "https://example.com/Organization", label: "Organization" }
    ]
  }
};

const result = SimpleInlineTextAnnotation.generate(input);
console.log(result);
// Output:
// [Elon Musk][Person] is a member of the [PayPal Mafia][Organization].
//
// [Person]: https://example.com/Person
// [Organization]: https://example.com/Organization
```

#### Explanation

The `generate` method takes an object with the following structure:

- `"text"`: The plain text to annotate.
- `"denotations"`: An array of objects, where each object specifies:
  - `"span"`: The character positions (`begin` and `end`) of the annotated text.
  - `"obj"`: The annotation type (URL or ID).
- `"config"`: Configuration for entity types, including:
  - `"id"`: The unique identifier for the entity type.
  - `"label"`: The human-readable label for the entity type.

## Relation Annotation

The `SimpleInlineTextAnnotation` gem supports advanced relation annotation, allowing you to define relationships between annotated entities. This is achieved by interpreting the second set of square brackets (`[]`) based on the number of elements it contains.

### Parsing Rules

- If the second `[]` contains **1 element**, it is treated as the annotation type (default behavior).
- If the second `[]` contains **2 elements**, the first element is interpreted as the `id` of the denotation, and the second element as the `obj` (annotation type).
- If the second `[]` contains **4 elements**, the elements are interpreted as follows:
  1. The first element is the `id` of the denotation and the `subj` of the relation.
  2. The second element is the `obj` (annotation type) of the denotation.
  3. The third element is the `pred` (predicate) of the relation.
  4. The fourth element is the `obj` of the relation.
- Any other cases are ignored.

### Example

```js
import SimpleInlineTextAnnotation from 'simple-inline-text-annotation'

const result = SimpleInlineTextAnnotation.parse("[Elon Musk][T1, Person, member_of, T2] is a member of the [PayPal Mafia][T2, Organization].");
console.log(result);

// Output:
// {
//   "text": "Elon Musk is a member of the PayPal Mafia.",
//   "denotations": [
//     { "id": "T1", "span": { "begin": 0, "end": 9 }, "obj": "Person" },
//     { "id": "T2", "span": { "begin": 29, "end": 41 }, "obj": "Organization" }
//   ],
//   "relations": [
//     { "pred": "member_of", "subj": "T1", "obj": "T2" },
//   ]
// }
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

### Generating Relation Annotation

The `generate` method can also create strings with relation annotations from structured data.

```js
import SimpleInlineTextAnnotation from 'simple-inline-text-annotation'

const input = {
  text: "Elon Musk is a member of the PayPal Mafia.",
  denotations: [
    { span: { begin: 0, end: 9 }, obj: "Person" },
    { span: { begin: 29, end: 41 }, obj: "Organization" }
  ],
  relations:[
    { pred: "member_of", subj: "T1", obj: "T2"}
  ]
};

const result = SimpleInlineTextAnnotation.generate(input);
console.log(result);
// Output:
// [Elon Musk][T1, Person, member_of, T2] is a member of the [PayPal Mafia][T2, Organization].
```

### Explanation

- The input object includes:
  - `"text"`: The plain text.
  - `"denotations"`: An array of annotations with `id`, `span`, and `obj`.
  - `"relations"`: An array of relationships, where:
    - `"subj"` and `"obj"` reference `id`s in the `denotations` array.
    - `"pred"` specifies the relationship type.
- The method generates a string with inline annotations and relationships.
