import { describe, expect, it } from 'vitest';
import { convertCase } from '../lib/text/caseConverter';

describe('convertCase', () => {
  it('normalizes camel case across spaces, underscores, and hyphens', () => {
    expect(convertCase('hello_world-test value', 'camel')).toBe('helloWorldTestValue');
  });

  it('normalizes snake case and strips non-word punctuation', () => {
    expect(convertCase('Hello World-Test!', 'snake')).toBe('hello_world_test');
  });

  it('normalizes kebab case and strips non-word punctuation', () => {
    expect(convertCase('Hello World_test!', 'kebab')).toBe('hello-world-test');
  });

  it('title case: capitalizes first word even when it is a small word', () => {
    expect(convertCase('the quick brown fox', 'title')).toBe('The Quick Brown Fox');
  });

  it('title case: capitalizes first word with leading punctuation', () => {
    expect(convertCase('"hello world"', 'title')).toBe('"Hello World"');
  });

  it('title case: keeps small words lowercase except when first', () => {
    expect(convertCase('a tale of two cities', 'title')).toBe('A Tale of Two Cities');
  });
});
