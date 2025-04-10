import SimpleInlineTextAnnotation from '../src/index.mjs';

describe('SimpleInlineTextAnnotation', () => {
  test('generate method should return an empty string', () => {
    const result = SimpleInlineTextAnnotation.generate();
    expect(result).toBe('');
  });
});
