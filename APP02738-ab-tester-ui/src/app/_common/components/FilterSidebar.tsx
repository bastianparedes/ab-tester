'use client';

import type { ReactNode } from 'react';

type Props = {
  applyLabel: string;
  children: ReactNode;
  onApply: () => void;
  title: string;
};

type FilterOption<Value extends string | number> = {
  label: string;
  value: Value;
};

export function FilterSidebar({ applyLabel, children, onApply, title }: Props) {
  return (
    <aside className="w-64 bg-white p-6 shadow-lg lg:min-h-[calc(100svh-90px)]" aria-label={title}>
      <h2 className="mb-6 text-xl font-bold text-slate-900">{title}</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onApply();
        }}
      >
        {children}
        <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-700 hover:shadow-lg">
          {applyLabel}
        </button>
      </form>
    </aside>
  );
}

export function FilterTextInput({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="mb-6 block text-sm font-semibold text-slate-700">
      <span className="mb-2 block">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
}

export function FilterCheckboxGroup<Value extends string | number>({
  label,
  onChange,
  options,
  selectedValues,
  optionsClassName = 'space-y-2',
}: {
  label: string;
  onChange: (values: Value[]) => void;
  options: FilterOption<Value>[];
  optionsClassName?: string;
  selectedValues: Value[];
}) {
  return (
    <fieldset className="mb-6">
      <legend className="mb-2 block text-sm font-semibold text-slate-700">{label}</legend>
      <div className={optionsClassName}>
        {options.map((option) => (
          <label key={String(option.value)} className="flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              onChange={() => onChange(selectedValues.includes(option.value) ? selectedValues.filter((value) => value !== option.value) : [...selectedValues, option.value])}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-slate-700">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function FilterSelect<Value extends string | number>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: Value) => void;
  options: FilterOption<Value>[];
  value: Value;
}) {
  return (
    <label className="mb-6 block text-sm font-semibold text-slate-700">
      <span className="mb-2 block">{label}</span>
      <select
        value={String(value)}
        onChange={(event) => {
          const option = options.find((item) => String(item.value) === event.target.value);
          if (option) onChange(option.value);
        }}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
