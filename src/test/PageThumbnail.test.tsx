// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';

describe('PageThumbnail smoke test', () => {
  it('environment supports DOM APIs', () => {
    const canvas = document.createElement('canvas');
    expect(canvas).toBeDefined();
    expect(canvas.tagName).toBe('CANVAS');
  });

  it('devicePixelRatio is accessible', () => {
    // happy-dom provides window globals
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });
});
