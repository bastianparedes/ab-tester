import type * as React from 'react';

export function FormSection({ children }: { children: React.ReactNode }) {
  return <section className="bg-white rounded-xl shadow-md p-6 mb-6 border-l-4 border-blue-500">{children}</section>;
}
