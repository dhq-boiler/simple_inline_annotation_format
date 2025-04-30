import SimpleInlineTextAnnotation from '../src/index.mjs';

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

  test("should not convert brackets when the number of annotations in brackets is invalid", () => {
    const source = "[Elon Musk][T1, Person, member_of, T2, Hoge] is a member of the [PayPal Mafia][T2, Organization, Fuga].";
    const expected = {
      text: "[Elon Musk][T1, Person, member_of, T2, Hoge] is a member of the [PayPal Mafia][T2, Organization, Fuga].",
      denotations: []
    };
    expect(SimpleInlineTextAnnotation.parse(source)).toStrictEqual(expected);
  });

  describe('when there are three consecutive brackets', () => {
    it('should process valid annotations and ignore the third bracket', () => {
      const source = "[Elon Musk][T1, Person, member_of, T2][Piyo] is a member of the PayPal Mafia.";
      const expected = {
        text: "Elon Musk[Piyo] is a member of the PayPal Mafia.",
        denotations: [
          { id: "T1", span: { begin: 0, end: 9 }, obj: "Person" }
        ],
        relations: [
          { pred: "member_of", subj: "T1", obj: "T2" }
        ]
      };
      expect(SimpleInlineTextAnnotation.parse(source)).toStrictEqual(expected);
    });

    it('should skip invalid annotations and ignore the third bracket', () => {
      const source = "[Elon Musk][T1, Person, member_of, T2, Hoge][Piyo] is a member of the PayPal Mafia.";
      const expected = {
        text: "[Elon Musk][T1, Person, member_of, T2, Hoge][Piyo] is a member of the PayPal Mafia.",
        denotations: []
      };
      expect(SimpleInlineTextAnnotation.parse(source)).toStrictEqual(expected);
    });
  });
});
