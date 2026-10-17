// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TranslationProvider, useTranslationContext } from '../index';

afterEach(cleanup);

const LanguageName = () => {
  const { selectedLanguage } = useTranslationContext();
  return <span>{selectedLanguage.name}</span>;
};

describe('TranslationProvider', () => {
  it('falls back to English when the requested language is unsupported', () => {
    render(
      <TranslationProvider language="unsupported">
        <LanguageName />
      </TranslationProvider>,
    );

    expect(screen.getByText('English')).toBeTruthy();
  });

  it('throws when the translation hook is used outside its provider', () => {
    expect(() => render(<LanguageName />)).toThrow('useTranslationContext must be used inside TranslationProvider');
  });
});
