'use client';

import { useState } from 'react';
import { useTranslationContext } from '@/app/_common/contexts/Translation';

export const ComponentLanguage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedLanguage, languages, setLanguage } = useTranslationContext();

  const handleSetLanguage = (lang: (typeof languages)[number]['key']) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="border-t border-gray-800 relative">
      {isOpen && (
        <div className="absolute top-full mb-2 left-4 right-4 bg-gray-800 rounded-lg shadow-xl border border-gray-700 cursor-pointer">
          {languages.map((language) => (
            <button
              key={language.key}
              type="button"
              onClick={() => handleSetLanguage(language.key)}
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-700 transition-colors text-left ${selectedLanguage.key === language.key ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
            >
              <span className="font-medium">{language.name}</span>
              {selectedLanguage.key === language.key && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm hover:bg-gray-750 transition-colors text-left font-medium"
      >
        {selectedLanguage.name}
      </button>
    </div>
  );
};
