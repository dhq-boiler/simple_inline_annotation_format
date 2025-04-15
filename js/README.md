# SimpleInlineTextAnnotation (npm package)

`SimpleInlineTextAnnotation` is a JavaScript library designed for working with inline text annotations. It allows you to parse and generate annotated text in a structured and efficient way.

## Installation

To install the library, use npm:

```bash
npm install simple-inline-text-annotation
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

