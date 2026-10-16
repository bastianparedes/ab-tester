'use client';

import type React from 'react';
import { createContext, useContext, useState } from 'react';
import cookie from '@/utils/cookie';
import constants from '../../../../config/constants';
import languagesObject from './languages';

type Language = keyof typeof languagesObject;
const languageKeys = Object.keys(languagesObject) as Language[];

type TranslationContextType = {
  translation: (typeof languagesObject)[Language]['labels'];
  languages: {
    key: Language;
    name: string;
    isSelected: boolean;
  }[];
  selectedLanguage: {
    key: Language;
    name: string;
  };
  setLanguage: (arg: Language) => void;
};
const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

type TranslationProviderProps = {
  children: React.ReactNode;
  language: string;
};
export function TranslationProvider({ children, language }: TranslationProviderProps) {
  const initialLanguage: Language = languageKeys.includes(language as Language) ? (language as Language) : 'english';
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);

  const setLanguage = (newLanguage: Language) => {
    setSelectedLanguage(newLanguage);
    cookie.set({
      exdays: 365,
      name: constants.cookieNames.lang,
      value: newLanguage,
    });
  };

  const translation = languagesObject[selectedLanguage].labels;
  const languages = languageKeys.map((key: Language) => ({
    isSelected: key === selectedLanguage,
    key: key,
    name: languagesObject[key].name,
  }));

  const selectedLanguageObject = {
    key: selectedLanguage,
    name: languagesObject[selectedLanguage].name,
  };

  return (
    <TranslationContext.Provider
      value={{
        languages,
        selectedLanguage: selectedLanguageObject,
        setLanguage,
        translation,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export const useTranslationContext = () => {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error('useTranslationContext must be used inside TranslationProvider');
  return ctx;
};
