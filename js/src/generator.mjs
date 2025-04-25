import Denotation from './denotation.mjs';
import DenotationValidator from './denotation_validator.mjs';
import GeneratorError from './generator_error.mjs';
import RelationValidator from './relation_validator.mjs';

class Generator {
  constructor(source) {
    this.source = Object.freeze({ ...source });
    this.denotations = this.#buildDenotations(source.denotations || []);
    this.config = this.source.config;
  }

  generate() {
    const text = this.source.text;
    if (!text) {
      throw new GeneratorError('The "text" key is missing.');
    }

    const denotations =  new DenotationValidator().validateDenotations(this.denotations, text.length);
    const annotatedText = this.#annotateText(text, denotations);
    const labelDefinitions = this.#buildLabelDefinitions();

    return [annotatedText, labelDefinitions].filter(Boolean).join('\n\n');
  }

  #buildDenotations(denotations) {
    return denotations.map(
      (d) => new Denotation(d.span.begin, d.span.end, d.obj, d.id || null)
    );
  }

  #annotateText(text, denotations) {
    // Annotate text from the end to ensure position calculation.
    denotations
      .sort((a, b) => b.beginPos - a.beginPos)
      .forEach((denotation) => {
        const beginPos = denotation.beginPos;
        const endPos = denotation.endPos;
        const annotation = denotation.id
          ? this.#getAnnotations(denotation)
          : this.#getObj(denotation.obj);

        const annotatedText = `[${text.slice(beginPos, endPos)}][${annotation}]`;
        text = text.slice(0, beginPos) + annotatedText + text.slice(endPos);
      });

    return text;
  }

  #buildLabelDefinitions() {
    const labeledEntityTypes = this.#labeledEntityTypes();
    if (!labeledEntityTypes || labeledEntityTypes.length === 0) {
      return null;
    }

    return labeledEntityTypes
      .map((entityType) => `[${entityType.label}]: ${entityType.id}`)
      .join('\n');
  }

  #labeledEntityTypes() {
    if (!this.config) {
      return null;
    }

    return (
      this.config['entity types']?.filter((entityType) =>
        entityType.hasOwnProperty('label')
      ) || null
    );
  }

  #getAnnotations(denotation) {
    const relations = new RelationValidator().validateRelations(this.source.relations || []);
    const relation = relations.find((relation) => relation.subj === denotation.id) || null;
    const annotations = [denotation.id, denotation.obj, relation?.pred, relation?.obj];

    if (!this.#labeledEntityTypes()) {
      return annotations.filter((item) => item !== null && item !== undefined).join(', ');
    }

    annotations[1] = this.#getObj(denotation.obj)
    const entity = this.#labeledEntityTypes().find((entityType) => entityType.id === denotation.obj);
    return annotations.filter((item) => item !== null && item !== undefined).join(', ');
  }

  #getObj(obj) {
    if (!this.#labeledEntityTypes()) {
      return obj;
    }

    const entity = this.#labeledEntityTypes().find((entityType) => entityType.id === obj);
    return entity ? entity.label : obj;
  }
}

export default Generator;
