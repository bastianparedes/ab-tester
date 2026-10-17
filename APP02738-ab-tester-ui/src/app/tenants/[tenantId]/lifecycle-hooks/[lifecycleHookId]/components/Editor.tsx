'use client';

import Monaco from '@monaco-editor/react';
import { jsCodeIsSingleAsyncArrowFunction } from '@/utils/jsCode';

type Props = {
  javascript: string;
  onChange: (javascript: string) => void;
};

export default function Editor({ javascript, onChange }: Props) {
  const isValidJavascript = jsCodeIsSingleAsyncArrowFunction(javascript);

  return (
    <>
      <div className="h-96 w-full min-w-0">
        <Monaco options={{ minimap: { enabled: false } }} theme="vs-dark" language="javascript" value={javascript} onChange={(value) => onChange(value ?? '')} />
      </div>
      {!isValidJavascript && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          The JavaScript code contains syntax errors.
        </p>
      )}
    </>
  );
}
