'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslationContext } from '@/app/_common/contexts/Translation';

type Option = {
  label: string;
  value: string;
};

type MultiSelectProps = {
  value: string[];
  options: Option[];
  onChange: (value: string[]) => void;
  placeholder?: string;
};

export default function MultiSelect({ value = [], options, onChange, placeholder }: MultiSelectProps) {
  const { translation } = useTranslationContext();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabels = options.filter((o) => value.includes(o.value)).map((o) => o.label);

  const filteredOptions = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative w-full">
      {/* trigger */}
      <button type="button" className="border w-full rounded p-2 bg-gray-200 cursor-pointer min-h-9.5 flex items-center" onClick={() => setOpen(!open)}>
        {selectedLabels.length === 0 ? (
          <span className="text-gray-500">{placeholder ?? translation.common.selectOptions}</span>
        ) : (
          <span className="text-sm">{selectedLabels.join(', ')}</span>
        )}
      </button>

      {/* dropdown */}
      {open && (
        <div className="absolute z-20 mt-1 w-full border rounded bg-white shadow max-h-60">
          {/* search */}
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder={translation.common.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm outline-none"
            />
          </div>

          {/* options */}
          <div className="max-h-48">
            {filteredOptions.length === 0 && <div className="p-2 text-sm text-gray-500">{translation.common.noResultsFound}</div>}

            {filteredOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer">
                <input type="checkbox" checked={value.includes(option.value)} onChange={() => toggleOption(option.value)} />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
