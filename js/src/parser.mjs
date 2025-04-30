import EntityTypeCollection from './entity_type_collection.mjs';
import Denotation from './denotation.mjs';
import SimpleInlineTextAnnotation from './index.mjs';

const ENTITY_TYPE_PATTERN = /^\s*\[([^\]]+)\]:\s+(\S+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*$/;
const ENTITY_TYPE_BLOCK_PATTERN = new RegExp(`(?:\\A|\\n\\s*\\n)((?:${ENTITY_TYPE_PATTERN.source}(?:\\n|$))+)`, 'gm');
const ANNOTATION_PATTERN = /(?<!\\)\[([^\[]+?)\]\[([^\]]+?)\]/;

class Parser {
  #source;
  #denotations;
  #entityTypeCollection;
  #relations;

  constructor(source) {
    this.#source = source;
    this.#entityTypeCollection = new EntityTypeCollection(source);
  }

  parse() {
    this.#denotations = [];
    this.#relations = [];
    let fullText = this.#sourceWithoutReferences();

    fullText = this.#processAnnotations(fullText);

    return new SimpleInlineTextAnnotation(
      fullText,
      this.#denotations,
      this.#relations,
      this.#entityTypeCollection
    );
  }

  // Remove references from the source.
  #sourceWithoutReferences() {
    return this.#source
      .replace(ENTITY_TYPE_BLOCK_PATTERN, (block) =>
        block.startsWith('\n\n') ? '\n\n' : ''
      )
      .trim();
  }

  #getObjFor(label) {
    return this.#entityTypeCollection.get(label) || label;
  }

  #processAnnotations(fullText) {
    const regex = new RegExp(ANNOTATION_PATTERN, 'g');
    let match;

    while ((match = regex.exec(fullText)) !== null) {
      const targetText = match[1];
      const beginPos = match.index;
      const endPos = beginPos + targetText.length;
      const annotations = match[2].split(', ');

      switch (annotations.length) {
        case 1:
          this.#processDenotation(beginPos, endPos, annotations[0]);
          break;

        case 2:
          this.#processDenotationWithId(beginPos, endPos, annotations);
          break;

        case 4:
          this.#processDenotationAndRelation(beginPos, endPos, annotations);
          break;

        default:
          regex.lastIndex = match.index + match[0].length;
          continue;
      }

      fullText = fullText.slice(0, match.index) + targetText + fullText.slice(match.index + match[0].length);
      regex.lastIndex = endPos;
    }

    return fullText;
  }

  #processDenotation(beginPos, endPos, label) {
    const obj = this.#getObjFor(label);
    this.#denotations.push(new Denotation(beginPos, endPos, obj));
  }

  #processDenotationWithId(beginPos, endPos, annotations) {
    const [id, label] = annotations;
    const obj = this.#getObjFor(label);
    this.#denotations.push(new Denotation(beginPos, endPos, obj, id));
  }

  #processDenotationAndRelation(beginPos, endPos, annotations) {
    const [subj, label, pred, obj2] = annotations;
    const obj = this.#getObjFor(label);
    this.#denotations.push(new Denotation(beginPos, endPos, obj, subj));
    this.#relations.push({ pred, subj, obj: obj2 });
  }
}

export default Parser;
