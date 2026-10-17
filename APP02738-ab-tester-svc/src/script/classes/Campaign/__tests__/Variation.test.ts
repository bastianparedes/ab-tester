import { afterEach, describe, expect, it, vi } from 'vitest';
import Variation from '../Variation';

describe('Variation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('adds CSS and HTML and runs variation JavaScript', () => {
    const elements: { tag: string; innerHTML?: string; outerHTML?: string }[] = [];
    const headAppend = vi.fn();
    const bodyAppend = vi.fn();
    vi.stubGlobal('document', {
      body: { appendChild: bodyAppend },
      createElement: (tag: string) => {
        const element: { tag: string; innerHTML?: string; outerHTML?: string } = { tag };
        elements.push(element);
        return element;
      },
      head: { appendChild: headAppend },
    });
    const javascript = vi.fn();
    const variation = new Variation({ css: '.banner { color: red; }', html: '<aside>Offer</aside>', javascript } as never, 42);

    variation.run();

    expect(headAppend).toHaveBeenCalledWith({ innerHTML: '.banner { color: red; }', tag: 'style' });
    expect(bodyAppend).toHaveBeenCalledWith({ outerHTML: '<aside>Offer</aside>', tag: 'div' });
    expect(javascript).toHaveBeenCalledOnce();
    expect(elements).toHaveLength(2);
  });

  it('logs failures from each independent variation step and continues', () => {
    const variation = new Variation({ css: '', html: '', javascript: () => undefined } as never, 42);
    const addHtml = vi.spyOn(variation, 'addHtml').mockImplementation(() => {
      throw new Error('html failed');
    });
    const addCss = vi.spyOn(variation, 'addCss').mockImplementation(() => {
      throw new Error('css failed');
    });
    const runJavascript = vi.spyOn(variation, 'runJavascript').mockImplementation(() => {
      throw new Error('javascript failed');
    });
    const logError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => variation.run()).not.toThrow();
    expect(addHtml).toHaveBeenCalledOnce();
    expect(addCss).toHaveBeenCalledOnce();
    expect(runJavascript).toHaveBeenCalledOnce();
    expect(logError).toHaveBeenCalledTimes(3);
  });
});
