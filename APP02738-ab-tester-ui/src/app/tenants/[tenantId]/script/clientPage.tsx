'use client';

import { abTesterCallDebugPanel, abTesterCampaignId, abTesterIgnoreRequirements, abTesterVariationId } from '@ab-tester/constants/debuggerPanel';
import { Bug, Check, Code, Copy, Link } from 'lucide-react';
import { useEffect, useState } from 'react';
import { minify } from 'terser';
import { Switch } from '@/app/_common/components/switch';
import { useTranslationContext } from '@/app/_common/contexts/Translation';

type Props = {
  url: string;
  script: string;
};

export function ClientPage({ url, script }: Props) {
  const { translation } = useTranslationContext();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isScriptExpanded, setIsScriptExpanded] = useState(true);
  const [isScriptFormatted, setIsScriptFormatted] = useState(true);
  const [formattedScript, setFormattedScript] = useState({ code: '', source: '' });

  useEffect(() => {
    if (!isScriptFormatted) return;

    let isCancelled = false;
    void minify(script, { compress: false, format: { beautify: true, comments: 'all' }, mangle: false })
      .then(({ code }) => {
        if (!isCancelled && code) setFormattedScript({ code, source: script });
      })
      .catch(() => {
        if (!isCancelled) setFormattedScript({ code: script, source: script });
      });

    return () => {
      isCancelled = true;
    };
  }, [isScriptFormatted, script]);

  const copyToClipboard = async (text: string, type: 'url' | 'code'): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch (err) {
      console.error(translation.script.copyError, err);
    }
  };

  const displayedScript = isScriptFormatted && formattedScript.source === script ? formattedScript.code : script;
  const scriptBytes = new TextEncoder().encode(script).length;

  return (
    <div className="bg-white p-6 flex items-center justify-center">
      <div className="max-w-4xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-blue-950">{translation.script.pageTitle}</h1>
        </div>

        {/* URL Section */}
        <div className="bg-blue-200 rounded-2xl p-6 shadow-xl border border-blue-600">
          <div className="flex items-center gap-2 mb-4">
            <Link className="text-blue-800" size={24} />
            <h2 className="text-xl font-semibold text-blue-950">{translation.script.urlTitle}</h2>
          </div>

          <div className="relative">
            <div className="w-full bg-white border border-blue-600 rounded-lg px-4 py-3 text-blue-950 pr-12 break-all">{url}</div>
            <button
              onClick={() => copyToClipboard(url, 'url')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-blue-300 rounded-lg transition-colors"
              type="button"
              title={translation.script.urlCopyTitle}
            >
              {copiedUrl ? <Check className="text-blue-800" size={20} /> : <Copy className="text-blue-800" size={20} />}
            </button>
          </div>
        </div>

        <div className="bg-blue-200 rounded-2xl p-6 shadow-xl border border-blue-600">
          <div className="flex items-center gap-2 mb-4">
            <Bug className="text-blue-800" size={24} />
            <h2 className="text-xl font-semibold text-blue-950">{translation.script.queryParamsTitle}</h2>
          </div>
          <dl className="text-sm text-blue-950">
            <div className="grid gap-2 border-t border-blue-400 py-4 grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-center">
              <dt>
                <code className="inline-block max-w-full overflow-x-auto whitespace-nowrap rounded bg-white px-2 py-1 align-bottom font-mono text-blue-950">
                  {abTesterCallDebugPanel}=true
                </code>
              </dt>
              <dd className="leading-relaxed text-blue-900">{translation.script.callDebugPanelDescription}</dd>
            </div>
            <div className="grid gap-2 border-t border-blue-400 py-4 grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-center">
              <dt>
                <code className="inline-block max-w-full overflow-x-auto whitespace-nowrap rounded bg-white px-2 py-1 align-bottom font-mono text-blue-950">
                  {abTesterCampaignId}=123
                </code>
              </dt>
              <dd className="leading-relaxed text-blue-900">{translation.script.campaignIdDescription}</dd>
            </div>
            <div className="grid gap-2 border-t border-blue-400 py-4 grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-center">
              <dt>
                <code className="inline-block max-w-full overflow-x-auto whitespace-nowrap rounded bg-white px-2 py-1 align-bottom font-mono text-blue-950">
                  {abTesterVariationId}=456
                </code>
              </dt>
              <dd className="leading-relaxed text-blue-900">{translation.script.variationIdDescription}</dd>
            </div>
            <div className="grid gap-2 border-y border-blue-400 py-4 grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-center">
              <dt>
                <code className="inline-block max-w-full overflow-x-auto whitespace-nowrap rounded bg-white px-2 py-1 align-bottom font-mono text-blue-950">
                  {abTesterIgnoreRequirements}=true
                </code>
              </dt>
              <dd className="leading-relaxed text-blue-900">{translation.script.ignoreRequirementsDescription}</dd>
            </div>
          </dl>
        </div>

        {/* Script Section */}
        <div className="bg-blue-200 rounded-2xl p-6 shadow-xl border border-blue-600">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Code className="text-blue-800" size={24} />
              <h2 className="text-xl font-semibold text-blue-950">{translation.script.scriptTitle}</h2>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(displayedScript, 'code')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg transition-colors"
            >
              {copiedCode ? (
                <>
                  <Check size={18} />
                  <span className="text-sm">{translation.script.scriptCopied}</span>
                </>
              ) : (
                <>
                  <Copy size={18} />
                  <span className="text-sm">{translation.script.scriptCopy}</span>
                </>
              )}
            </button>
          </div>

          <div className="my-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-y border-blue-400/70 py-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-3 text-sm font-medium text-blue-950">
                <Switch
                  checked={isScriptFormatted}
                  onChange={(event) => setIsScriptFormatted(event.target.checked)}
                  aria-label={translation.script.scriptFormat}
                  className="h-5 w-10 bg-blue-300 shadow-none checked:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 before:h-3.5 before:w-3.5 checked:before:translate-x-5"
                />
                {translation.script.scriptFormat}
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-blue-950">
                <Switch
                  checked={isScriptExpanded}
                  onChange={(event) => setIsScriptExpanded(event.target.checked)}
                  aria-label={isScriptExpanded ? translation.script.scriptShowLess : translation.script.scriptShowMore}
                  aria-controls="script-preview"
                  className="h-5 w-10 bg-blue-300 shadow-none checked:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 before:h-3.5 before:w-3.5 checked:before:translate-x-5"
                />
                {isScriptExpanded ? translation.script.scriptShowLess : translation.script.scriptShowMore}
              </div>
            </div>
            <dl className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-blue-900">
              <div>
                <dt>{translation.script.scriptCharacters}</dt>
                <dd className="font-semibold text-blue-950">{script.length}</dd>
              </div>
              <div>
                <dt>{translation.script.scriptBytes}</dt>
                <dd className="font-semibold text-blue-950">{scriptBytes}</dd>
              </div>
              <div>
                <dt>{translation.script.scriptKBs}</dt>
                <dd className="font-semibold text-blue-950">{(scriptBytes / 1024).toFixed(1)}</dd>
              </div>
              <div>
                <dt>{translation.script.scriptMBs}</dt>
                <dd className="font-semibold text-blue-950">{(scriptBytes / (1024 * 1024)).toFixed(1)}</dd>
              </div>
            </dl>
          </div>

          <pre
            id="script-preview"
            className={`w-full overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 px-4 py-4 font-mono text-sm leading-6 text-slate-100 shadow-inner whitespace-pre-wrap wrap-break-word ${
              isScriptExpanded ? '' : 'max-h-64 overflow-hidden'
            }`}
          >
            <code>{displayedScript}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
