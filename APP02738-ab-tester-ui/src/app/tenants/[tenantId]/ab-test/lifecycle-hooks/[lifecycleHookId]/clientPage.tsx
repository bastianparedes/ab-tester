'use client';

import type { TypeStatus } from '@ab-tester/constants/types/constants';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/app/_common/components/button';
import { FormSection } from '@/app/_common/components/FormSection';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import constants from '@/config/constants';
import { apiCaller } from '@/libs/restClient';
import { jsCodeIsSingleAsyncArrowFunction } from '@/utils/jsCode';
import { createInitialLifecycleHookJavascript } from '../lifecycleHookJavascript';
import Editor from './components/Editor';

export const lifecycleHookOptions = [
  'scriptStart',
  'trackEventStart',
  'trackEventEnd',
  'executionGroupStart',
  'executionGroupEnd',
  'campaignStart',
  'campaignEnd',
  'variantCampaignStart',
  'variantCampaignEnd',
  'scriptEnd',
] as const;

export type TypeLifecycleHook = {
  status: TypeStatus;
  id?: number;
  tenantId: number;
  name: string;
  trigger: (typeof lifecycleHookOptions)[number];
  javascript: string;
};

type PageProps = {
  tenantId: number;
  initialLifecycleHook: TypeLifecycleHook;
};

export function ClientPage({ tenantId, initialLifecycleHook }: PageProps) {
  const { translation } = useTranslationContext();
  const [lifecycleHook, setLifecycleHook] = useState<TypeLifecycleHook>(initialLifecycleHook);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const canSave = lifecycleHook.name.trim().length > 0 && jsCodeIsSingleAsyncArrowFunction(lifecycleHook.javascript) && !isSaving;

  const handleSave = async () => {
    const option = lifecycleHook.trigger;

    setIsSaving(true);
    setSaveError(null);

    try {
      const body = {
        javascript: lifecycleHook.javascript,
        name: lifecycleHook.name.trim(),
        option,
        status: lifecycleHook.status,
      };
      const response =
        lifecycleHook.id === undefined
          ? await apiCaller.lifecycleHooks.create({ body, pathParams: { tenantId } })
          : await apiCaller.lifecycleHooks.update({ body, pathParams: { lifecycleHookId: lifecycleHook.id, tenantId } });

      if (!response.ok) {
        setSaveError(translation.lifecycleHooks.saveError);
        return;
      }

      location.href = constants.pages.lifecycleHooks({ tenantId });
    } catch {
      setSaveError(translation.lifecycleHooks.saveUnexpectedError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExit = () => {
    location.href = constants.pages.lifecycleHooks({ tenantId });
  };

  const handleTriggerChange = (trigger: TypeLifecycleHook['trigger']) => {
    setLifecycleHook((current) => ({
      ...current,
      javascript: createInitialLifecycleHookJavascript(trigger),
      trigger,
    }));
  };

  return (
    <div className="w-9/10 mx-auto my-8 relative flex flex-col gap-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-blue-900 mb-2">
            {lifecycleHook.id === undefined ? translation.lifecycleHooks.createTitle : translation.lifecycleHooks.editTitle}
          </h1>
          <p className="text-blue-600">{translation.lifecycleHooks.headerSubTitle}</p>
        </div>
        <div className="relative">
          <select
            aria-label={translation.lifecycleHooks.statusAriaLabel}
            value={lifecycleHook.status}
            disabled={isSaving}
            onChange={(event) => setLifecycleHook({ ...lifecycleHook, status: event.target.value === 'active' ? 'active' : 'inactive' })}
            className={`outline-none px-6 py-2 rounded-lg font-semibold transition-all shadow-md appearance-none cursor-pointer pr-10 ${
              lifecycleHook.status === 'active' ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-400 text-white hover:bg-gray-500'
            }`}
          >
            <option value="active">{translation.common.active}</option>
            <option value="inactive">{translation.common.inactive}</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white">
            <ChevronDown aria-hidden="true" />
          </div>
        </div>
      </div>

      <FormSection>
        <label htmlFor="lifecycle-hook-name" className="block text-xl font-semibold text-blue-900 mb-4">
          {translation.lifecycleHooks.name}
        </label>
        <input
          id="lifecycle-hook-name"
          type="text"
          value={lifecycleHook.name}
          onChange={(event) => setLifecycleHook({ ...lifecycleHook, name: event.target.value })}
          className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
        />
      </FormSection>

      <FormSection>
        <h2 id="lifecycle-hook-trigger" className="text-xl font-semibold text-blue-900 mb-4">
          {translation.lifecycleHooks.trigger}
        </h2>
        <div className="flex flex-col gap-3">
          {lifecycleHookOptions.map((option) => (
            <label key={option} className="flex items-center gap-3 py-1 text-xl font-bold cursor-pointer">
              <input
                type="radio"
                name="lifecycle-hook-option"
                value={option}
                checked={lifecycleHook.trigger === option}
                onChange={() => handleTriggerChange(option)}
                className="h-4 w-4 shrink-0 accent-blue-600"
              />
              <span>{translation.lifecycleHooks.triggerOptions[option]}</span>
            </label>
          ))}
        </div>
      </FormSection>

      <FormSection>
        <h2 className="text-xl font-semibold text-blue-900 mb-4">{translation.lifecycleHooks.javascript}</h2>
        <Editor javascript={lifecycleHook.javascript} onChange={(javascript) => setLifecycleHook({ ...lifecycleHook, javascript })} />
      </FormSection>

      {saveError && (
        <p role="alert" className="text-sm text-red-600">
          {saveError}
        </p>
      )}
      <div className="mt-2 flex justify-end gap-4">
        <Button disabled={isSaving} onClick={handleExit} variant="destructive">
          {translation.lifecycleHooks.exit}
        </Button>
        <Button disabled={!canSave} onClick={handleSave} variant="default">
          {isSaving ? translation.lifecycleHooks.saving : translation.lifecycleHooks.save}
        </Button>
      </div>
    </div>
  );
}
