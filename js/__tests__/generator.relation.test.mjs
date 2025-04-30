import SimpleInlineTextAnnotation from '../src/index.mjs';

describe('SimpleInlineTextAnnotation.generate', () => {
  test('should display ids in annotations even when relations are missing', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 0, end: 9 }, obj: "Person" },
        { id: "T2", span: { begin: 29, end: 41 }, obj: "Organization" }
      ]
    };
    const expected = "[Elon Musk][T1, Person] is a member of the [PayPal Mafia][T2, Organization].";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

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

  test('should ignore the invalid denotation and its relation when denotation is invalid and relation exists', () => {
    const source = {
    text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T1", span: { begin: 0.1, end: 9.6 }, obj: "Person" }
      ],
      relations: [
        { pred: "member_of", subj: "T1", obj: "T2" }
      ]
    };
    const expected = "Elon Musk is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should not generate the relation when subject does not exist', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { id: "T2", span: { begin: 29, end: 41 }, obj: "Organization" }
      ],
      relations: [
        { subj: "T1", pred: "member_of", obj: "T2" }
      ]
    };
    const expected = "Elon Musk is a member of the [PayPal Mafia][T2, Organization].";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should not generate the relation when both subject and object do not exist', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [],
      relations: [
        { subj: "T1", pred: "member_of", obj: "T2" }
      ]
    };
    const expected = "Elon Musk is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  describe('when relation keys are missing', () => {
    test('should not generate the relation when subj is missing', () => {
      const source = {
        text: "Elon Musk is a member of the PayPal Mafia.",
        denotations: [
          { id: "T1", span: { begin: 0, end: 9 }, obj: "Person" }
        ],
        relations: [
          { pred: "member_of", obj: "T2" }
        ]
      };
      const expected = "[Elon Musk][T1, Person] is a member of the PayPal Mafia.";
      expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
    });

    test('should not generate the relation when obj is missing', () => {
      const source = {
        text: "Elon Musk is a member of the PayPal Mafia.",
        denotations: [
          { id: "T1", span: { begin: 0, end: 9 }, obj: "Person" }
        ],
        relations: [
          { subj: "T1", pred: "member_of" }
        ]
      };
      const expected = "[Elon Musk][T1, Person] is a member of the PayPal Mafia.";
      expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
    });

    test('should not generate the relation when pred is missing', () =>{
      const source = {
        text: "Elon Musk is a member of the PayPal Mafia.",
        denotations: [
          { id: "T1", span: { begin: 0, end: 9 }, obj: "Person" }
        ],
        relations: [
          { subj: "T1", obj: "T2" }
        ]
      };
      const expected = "[Elon Musk][T1, Person] is a member of the PayPal Mafia.";
      expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
    });
  });
});
