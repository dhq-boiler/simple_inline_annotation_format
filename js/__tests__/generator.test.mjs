import SimpleInlineTextAnnotation from '../src/index.mjs';

describe('SimpleInlineTextAnnotation.generate', () => {
  test('should generate annotation structure when source has denotations', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 0, end: 9 }, obj: "Person" },
        { id: "T2", span: { begin: 29, end: 41 }, obj: "Organization" }
      ],
      relations: [
        { pred: "member_of", subj: "T1", obj: "T2" }
      ]
    };
    const expected = "[Elon Musk][T1, Person, member_of, T2] is a member of the [PayPal Mafia][T2, Organization].";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should generate label definition structure when source has config', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 0, end: 9 }, obj: "https://example.com/Person" },
        { id: "T2", span: { begin: 29, end: 41 }, obj: "https://example.com/Organization" }
      ],
      relations: [
        { pred: "member_of", subj: "T1", obj: "T2" }
      ],
      config: {
        "entity types": [
          { id: "https://example.com/Person", label: "Person" },
          { id: "https://example.com/Organization", label: "Organization" }
        ]
      }
    };
    const expected = `[Elon Musk][T1, Person, member_of, T2] is a member of the [PayPal Mafia][T2, Organization].

[Person]: https://example.com/Person
[Organization]: https://example.com/Organization`;
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should create only annotation structure when entity type label is missing', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 0, end: 9 }, obj: "Person" }
      ],
      relations: [
        { pred: "member_of", subj: "T1", obj: "T2" }
      ],
      config: {
        "entity types": [
          { id: "Person" }
        ]
      }
    };
    const expected = "[Elon Musk][T1, Person, member_of, T2] is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should not parse as annotation when span value is not integer', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 0.1, end: 9.6 }, obj: "Person" },
        { id: "T2", span: { begin: "0", end: "9" }, obj: "Organization" }
      ],
      relations: [
        { pred: "member_of", subj: "T1", obj: "T2" }
      ]
    };
    const expected = "Elon Musk is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should use first denotation when source has same span denotations', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 0, end: 9 }, obj: "Person" },
        { id: "T2", span: { begin: 0, end: 9 }, obj: "Organization" }
      ],
      relations: [
        { pred: "member_of", subj: "T1", obj: "T2" }
      ]
    };
    const expected = "[Elon Musk][T1, Person, member_of, T2] is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should use only outer denotation when source has nested span within another span', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 0, end: 9 }, obj: "Person" },
        { id: "T2", span: { begin: 2, end: 6 }, obj: "Organization" }
      ],
      relations: [
        { pred: "member_of", subj: "T1", obj: "T2" }
      ]
    };
    const expected = "[Elon Musk][T1, Person, member_of, T2] is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should use only outer denotation when begin is inside another span', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 0, end: 4 }, obj: "First name" },
        { id: "T2", span: { begin: 0, end: 9 }, obj: "Full name" }
      ],
      relations: [
        { pred: "part_of", subj: "T1", obj: "T2" }
      ]
    };
    const expected = "[Elon Musk][T2, Full name] is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should use only outer denotation when end is inside another span', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 6, end: 9 }, obj: "Last name" },
        { id: "T2", span: { begin: 0, end: 9 }, obj: "Full name" }
      ],
      relations: [
        { pred: "part_of", subj: "T1", obj: "T2" }
      ]
    };
    const expected = "[Elon Musk][T2, Full name] is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should ignore denotations when source has boundary-crossing denotations', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 0, end: 9 }, obj: "Person" },
        { id: "T2", span: { begin: 8, end: 11 }, obj: "Organization" }
      ],
      relations: [
        { pred: "part_of", subj: "T1", obj: "T2" }
      ]
    };
    const expected = "Elon Musk is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should ignore denotations when span is negative', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: -1, end: 9 }, obj: "Person" }
      ],
      relations: [
        { pred: "part_of", subj: "T1", obj: "T2" }
      ]
    };
    const expected = "Elon Musk is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should ignore denotations when span is invalid', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 4, end: 0 }, obj: "Person" }
      ],
      relations: [
        { pred: "part_of", subj: "T1", obj: "T2" }
      ]
    };
    const expected = "Elon Musk is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should ignore denotations when span is out of bounds with text length', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 100, end: 200 }, obj: "Person" }
      ],
      relations: [
        { pred: "part_of", subj: "T1", obj: "T2" }
      ]
    };
    const expected = "Elon Musk is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should throw GeneratorError when source text key is missing', () => {
    const source = {
      denotations: [
        { id: "T1", span: { begin: 4, end: 0 }, obj: "Person" }
      ],
      relations: [
        { pred: "part_of", subj: "T1", obj: "T2" }
      ]
    };
    expect(() => SimpleInlineTextAnnotation.generate(source)).toThrow('The "text" key is missing.');
  });
});
