class RelationValidator {
  validateRelations(relations) {
    return this.#removeIncompleteKeyRelations(relations);
  }

  #removeIncompleteKeyRelations(relations) {
    return relations.filter((relation) => {
      return relation.subj && relation.pred && relation.obj;
    });
  }
}

export default RelationValidator;
