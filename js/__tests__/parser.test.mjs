import SimpleInlineTextAnnotation from '../src/index.mjs';
import Parser from '../src/parser.mjs';

describe('SimpleInlineTextAnnotation.parse', () => {
  test('should parse as denotation when source has annotation structure', () => {
    const source = "[Elon Musk][T1, Person, member_of, T2] is a member of the [PayPal Mafia][T2, Organization].";
    const expected = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 0, end: 9 }, obj: "Person" },
        { id: "T2", span: { begin: 29, end: 41 }, obj: "Organization" }
      ],
      relations: [
        { subj: "T1", pred: "member_of", obj: "T2" }
      ]
    };
    expect(SimpleInlineTextAnnotation.parse(source)).toStrictEqual(expected);
  });

  test('should parse as entity types and apply id to denotation obj when source has reference structure', () => {
    const source = `[Elon Musk][T1, Person, member_of, T2] is a member of the [PayPal Mafia][T2, Organization].

[Person]: https://example.com/Person
[Organization]: https://example.com/Organization`;
    const expected = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 0, end: 9 }, obj: "https://example.com/Person" },
        { id: "T2", span: { begin: 29, end: 41 }, obj: "https://example.com/Organization" }
      ],
      relations: [
        { subj: "T1", pred: "member_of", obj: "T2" }
      ],
      config: {
        "entity types": [
          { id: "https://example.com/Person", label: "Person" },
          { id: "https://example.com/Organization", label: "Organization" }
        ]
      }
    };
    expect(SimpleInlineTextAnnotation.parse(source)).toStrictEqual(expected);
  });

  test('should not parse as annotation when source has metacharacter escape', () => {
    const source = '\\[Elon Musk][T1, Person, member_of, T2] is a member of the [PayPal Mafia][T2, Organization].';
    const expected = {
      text: "[Elon Musk][T1, Person, member_of, T2] is a member of the PayPal Mafia.",
      denotations: [
        { id: "T2", span: { begin: 59, end: 71 }, obj: "Organization" }
      ]
    };
    expect(SimpleInlineTextAnnotation.parse(source)).toStrictEqual(expected);
  });

  test('should not use as references when reference definitions do not have a blank line above', () => {
    const source = `[Elon Musk][T1, Person, member_of, T2] is a member of the PayPal Mafia.
[Person]: https://example.com/Person`;
    const expected = {
      text: "Elon Musk is a member of the PayPal Mafia.\n[Person]: https://example.com/Person",
      denotations: [
        { id: "T1", span: { begin: 0, end: 9 }, obj: "Person" }
      ],
      relations: [
        { subj: "T1", pred: "member_of", obj: "T2" }
      ]
    };
    expect(SimpleInlineTextAnnotation.parse(source)).toStrictEqual(expected);
  });

  test('should use definitions as references when reference definitions have a blank line above', () => {
    const source = `[Elon Musk][T1, Person, member_of, T2] is a member of the PayPal Mafia.

[Person]: https://example.com/Person`;
    const expected = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 0, end: 9 }, obj: "https://example.com/Person" }
      ],
      relations: [
        { subj: "T1", pred: "member_of", obj: "T2" }
      ],
      config: {
        "entity types": [
          { id: "https://example.com/Person", label: "Person" }
        ]
      }
    };
    expect(SimpleInlineTextAnnotation.parse(source)).toStrictEqual(expected);
  });

  test('should parse as reference link when reference contains additional text enclosed with quotation', () => {
    const source = `[Elon Musk][T1, Person, member_of, T2] is a member of the [PayPal Mafia][T2, Organization].

[Person]: https://example.com/Person "text"
[Organization]: https://example.com/Organization 'text'`;
    const expected = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 0, end: 9 }, obj: "https://example.com/Person" },
        { id: "T2", span: { begin: 29, end: 41 }, obj: "https://example.com/Organization" }
      ],
      relations: [
        { subj: "T1", pred: "member_of", obj: "T2" }
      ],
      config: {
        "entity types": [
          { id: "https://example.com/Person", label: "Person" },
          { id: "https://example.com/Organization", label: "Organization" }
        ]
      }
    };
    expect(SimpleInlineTextAnnotation.parse(source)).toStrictEqual(expected);
  });

  test('should not parse as reference link when reference contains additional text not enclosed with quotation', () => {
    const source = `[Elon Musk][T1, Person, member_of, T2] is a member of the PayPal Mafia.

[Person]: https://example.com/Person text`;
    const expected = {
      text: "Elon Musk is a member of the PayPal Mafia.\n\n[Person]: https://example.com/Person text",
      denotations: [
        { id: "T1", span: { begin: 0, end: 9 }, obj: "Person" }
      ],
      relations: [
        { subj: "T1", pred: "member_of", obj: "T2" }
      ]
    };
    expect(SimpleInlineTextAnnotation.parse(source)).toStrictEqual(expected);
  });

  test('should parse as expected format when text is written below the reference definition', () => {
    const source = `[Elon Musk][T1, Person, member_of, T2] is a member of the PayPal Mafia.

[Person]: https://example.com/Person
hello`;
    const expected = {
      text: "Elon Musk is a member of the PayPal Mafia.\n\nhello",
      denotations: [
        { id: "T1", span: { begin: 0, end: 9 }, obj: "https://example.com/Person" }
      ],
      relations: [
        { subj: "T1", pred: "member_of", obj: "T2" }
      ],
      config: {
        "entity types": [
          { id: "https://example.com/Person", label: "Person" }
        ]
      }
    };
    expect(SimpleInlineTextAnnotation.parse(source)).toStrictEqual(expected);
  });

  test('should use first defined id in priority when reference id is duplicated', () => {
    const source = `[Elon Musk][T1, Person, member_of, T2] is a member of the PayPal Mafia.

[Person]: https://example.com/Person
[Person]: https://example.com/Organization`;
    const expected = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 0, end: 9 }, obj: "https://example.com/Person" }
      ],
      relations: [
        { subj: "T1", pred: "member_of", obj: "T2" }
      ],
      config: {
        "entity types": [
          { id: "https://example.com/Person", label: "Person" }
        ]
      }
    };
    expect(SimpleInlineTextAnnotation.parse(source)).toStrictEqual(expected);
  });

  test('should not create config when reference label and id are the same', () => {
    const source = `[Elon Musk][T1, Person, member_of, T2] is a member of the PayPal Mafia.

[Person]: Person`;
    const expected = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 0, end: 9 }, obj: "Person" }
      ],
      relations: [
        { subj: "T1", pred: "member_of", obj: "T2" }
      ]
    };
    expect(SimpleInlineTextAnnotation.parse(source)).toStrictEqual(expected);
  });

  test('should parse as single newline when consecutive newlines in source', () => {
    const source = `[Elon Musk][T1, Person, member_of, T2] is a member of the PayPal Mafia.


Elon Musk is a member of the PayPal Mafia.`;
    const expected = {
      text: "Elon Musk is a member of the PayPal Mafia.\n\nElon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 0, end: 9 }, obj: "Person" }
      ],
      relations: [
        { subj: "T1", pred: "member_of", obj: "T2" }
      ]
    };
    expect(SimpleInlineTextAnnotation.parse(source)).toStrictEqual(expected);
  });

  test('should parse as entity types with ignoring white spaces before reference definition', () => {
    const source = `  [Elon Musk][T1, Person, member_of, T2] is a member of the [PayPal Mafia][T2, Organization].

  [Person]: https://example.com/Person
  [Organization]: https://example.com/Organization`;
    const expected = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 0, end: 9 }, obj: "https://example.com/Person" },
        { id: "T2", span: { begin: 29, end: 41 }, obj: "https://example.com/Organization" }
      ],
      relations: [
        { subj: "T1", pred: "member_of", obj: "T2" }
      ],
      config: {
        "entity types": [
          { id: "https://example.com/Person", label: "Person" },
          { id: "https://example.com/Organization", label: "Organization" }
        ]
      }
    };
    expect(SimpleInlineTextAnnotation.parse(source)).toStrictEqual(expected);
  });
});

describe('Parser', () => {
  test('should not accumulate denotations when parse is called multiple times', () => {
    const source = `[Elon Musk][T1, Person, member_of, T2] is a member of the [PayPal Mafia][T2, Organization].

[Person]: https://example.com/Person
[Organization]: https://example.com/Organization`;

    const parser = new Parser(source);
    parser.parse();
    const result = parser.parse().toObject();

    expect(result.denotations).toEqual([
      { id: "T1", span: { begin: 0, end: 9 }, obj: "https://example.com/Person" },
      { id: "T2", span: { begin: 29, end: 41 }, obj: "https://example.com/Organization" },
    ]);
  });
});
