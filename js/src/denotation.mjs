class Denotation {
  #beginPos;
  #endPos;
  #obj;
  #id;

  constructor(beginPos, endPos, obj, id = null) {
    this.#beginPos = beginPos;
    this.#endPos = endPos;
    this.#obj = obj;
    this.#id = id;
  }

  get beginPos() {
    return this.#beginPos;
  }

  get endPos() {
    return this.#endPos;
  }

  get obj() {
    return this.#obj;
  }

  get id() {
    return this.#id;
  }

  get span() {
    return { begin: this.#beginPos, end: this.#endPos };
  }

  toObject() {
    const result = { span: this.span, obj: this.#obj };
    if (this.#id) {
      result.id = this.#id;
    }
    return result;
  }

  isNestedWithin(other) {
    return other.beginPos <= this.#beginPos && this.#endPos <= other.endPos;
  }

  get isPositionNotInteger() {
    return !(Number.isInteger(this.#beginPos) && Number.isInteger(this.endPos));
  }

  get isPositionNegative() {
    return this.#beginPos < 0 || this.#endPos < 0;
  }

  get isPositionInvalid() {
    return this.#beginPos > this.#endPos;
  }

  isOutOfBounds(textLength) {
    return this.#beginPos >= textLength || this.#endPos > textLength;
  }

  isBoundaryCrossing(other) {
    const startsInsideOther =
      this.#beginPos > other.beginPos && this.#beginPos < other.endPos;
    const endsInsideOther =
      this.#endPos > other.beginPos && this.#endPos < other.endPos;

    return startsInsideOther || endsInsideOther;
  }
}

export default Denotation;
