import SimpleInlineTextAnnotation from '../src/index.mjs';

describe('SimpleInlineTextAnnotation.generate', () => {
  test('should generate annotation structure when source has denotations', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { span: { begin: 0, end: 9 }, obj: "Person" },
        { span: { begin: 29, end: 41 }, obj: "Organization" }
      ]
    };
    const expected = "[Elon Musk][Person] is a member of the [PayPal Mafia][Organization].";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should generate label definition structure when source has config', () => {
    const source = {
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
    const expected = `[Elon Musk][Person] is a member of the [PayPal Mafia][Organization].

[Person]: https://example.com/Person
[Organization]: https://example.com/Organization`;
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

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

  test('should not generate any denotation when denotation is missing', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: []
    };
    const expected = "Elon Musk is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should not parse as annotation when span value is not integer', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { span: { begin: 0.1, end: 9.6 }, obj: "Person" },
      ]
    };
    const expected = "Elon Musk is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should use first denotation when source has same span denotations', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { span: { begin: 0, end: 9 }, obj: "Person" },
        { span: { begin: 0, end: 9 }, obj: "Organization" }
      ]
    };
    const expected = "[Elon Musk][Person] is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should use only outer denotation when source has nested span within another span', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { span: { begin: 0, end: 9 }, obj: "Person" },
        { span: { begin: 2, end: 6 }, obj: "Organization" }
      ]
    };
    const expected = "[Elon Musk][Person] is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should use only outer denotation when begin is inside another span', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { span: { begin: 0, end: 4 }, obj: "First name" },
        { span: { begin: 0, end: 9 }, obj: "Full name" }
      ]
    };
    const expected = "[Elon Musk][Full name] is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should use only outer denotation when end is inside another span', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { span: { begin: 6, end: 9 }, obj: "Last name" },
        { span: { begin: 0, end: 9 }, obj: "Full name" }
      ]
    };
    const expected = "[Elon Musk][Full name] is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should ignore denotations when source has boundary-crossing denotations', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { span: { begin: 0, end: 9 }, obj: "Person" },
        { span: { begin: 8, end: 11 }, obj: "Organization" }
      ]
    };
    const expected = "Elon Musk is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should ignore denotations when span is negative', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { span: { begin: -1, end: 9 }, obj: "Person" }
      ]
    };
    const expected = "Elon Musk is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should ignore denotations when span is invalid', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { span: { begin: 4, end: 0 }, obj: "Person" }
      ]
    };
    const expected = "Elon Musk is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  test('should ignore denotations when span is out of bounds with text length', () => {
    const source = {
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { span: { begin: 100, end: 200 }, obj: "Person" }
      ]
    };
    const expected = "Elon Musk is a member of the PayPal Mafia.";
    expect(SimpleInlineTextAnnotation.generate(source)).toBe(expected);
  });

  describe('with relation', () => {
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

  test('should throw GeneratorError when source text key is missing', () => {
    const source = {
      denotations: [
        { span: { begin: 4, end: 0 }, obj: "Person" }
      ]
    };
    expect(() => SimpleInlineTextAnnotation.generate(source)).toThrow('The "text" key is missing.');
  });
});
