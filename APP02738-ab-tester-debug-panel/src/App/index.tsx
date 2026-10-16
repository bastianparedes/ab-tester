import { abTesterCallDebugPanel, abTesterCampaignId, abTesterIgnoreRequirements, abTesterVariationId } from '@ab-tester/constants/debuggerPanel';
import { Check, FlaskConical, Link, Minus } from 'lucide-react';
import { useState } from 'react';
import { useSessionStorage } from './useSessionStorage';

const campaigns = window.ab_tester.campaignsData;

const FloatingWidget = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [campaignId, setCampaignId] = useSessionStorage<number | null>(abTesterCampaignId, null);
  const [variationId, setVariationId] = useSessionStorage<number | null>(abTesterVariationId, null);
  const [ignoreRequirements, setIgnoreRequirements] = useSessionStorage<boolean>(abTesterIgnoreRequirements, false);
  useSessionStorage<boolean>(abTesterCallDebugPanel, true);

  const handleMinimize = () => {
    setIsClosing(true);

    setTimeout(() => {
      setIsMinimized(true);
      setIsClosing(false);
    }, 250);
  };

  const handleExpand = () => {
    setIsMinimized(false);
  };

  const campaignSelected = campaigns.find((campaign) => campaign.id === campaignId);

  const onCopy = async () => {
    const url = new URL(location.href);
    if (campaignId === null || variationId === null) return;

    url.searchParams.set(abTesterCampaignId, String(campaignId));
    url.searchParams.set(abTesterVariationId, String(variationId));
    url.searchParams.set(abTesterIgnoreRequirements, String(ignoreRequirements));
    url.searchParams.delete(abTesterCallDebugPanel);

    await navigator.clipboard.writeText(url.toString());

    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const applyChanges = () => {
    const url = new URL(location.href);
    if (campaignId === null || variationId === null) return;

    url.searchParams.set(abTesterCampaignId, String(campaignId));
    url.searchParams.set(abTesterVariationId, String(variationId));
    url.searchParams.set(abTesterIgnoreRequirements, String(ignoreRequirements));
    url.searchParams.set(abTesterCallDebugPanel, String(true));

    location.href = url.toString();
  };

  const showButton = isMinimized || isClosing;

  return (
    <>
      {/* BOTÓN */}
      <button
        type="button"
        onClick={handleExpand}
        className={`fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 
        flex items-center justify-center cursor-pointer
        transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        ${showButton ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}
        aria-label="Expand widget"
      >
        <FlaskConical className="h-5 w-5" />
      </button>

      {/* WIDGET */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-80 rounded-xl border border-blue-200 bg-white shadow-2xl 
        transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        ${isClosing ? 'opacity-0 scale-95 translate-y-4' : !isMinimized ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`}
      >
        <div className="flex items-center justify-between bg-blue-600 rounded-t-xl px-4 py-3">
          <span className="text-sm font-semibold text-white">AB Tester Settings</span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onCopy}
              disabled={campaignId === null || variationId === null}
              className={`h-7 w-7 rounded-md flex items-center justify-center transition-all duration-300
                ${copied ? 'bg-blue-500 text-white scale-110 shadow-md' : 'text-blue-200 hover:text-white hover:bg-blue-700'}
                enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {copied ? <Check className="h-4 w-4 transition-all duration-300 scale-110" /> : <Link className="h-4 w-4 transition-all duration-300" />}
            </button>

            <button
              type="button"
              onClick={handleMinimize}
              className="h-7 w-7 rounded-md text-blue-200 enabled:hover:text-white enabled:hover:bg-blue-700 flex items-center justify-center transition-colors enabled:cursor-pointer"
              aria-label="Minimize"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ab-tester-debug-tool-select-campaign" className="text-xs font-medium text-blue-500">
              Campaign
            </label>
            <select
              id="ab-tester-debug-tool-select-campaign"
              value={String(campaignId)}
              onChange={(e) => {
                setVariationId(null);
                setCampaignId(Number(e.target.value));
              }}
              className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="null" disabled>
                Select...
              </option>

              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>

          {campaignSelected && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ab-tester-debug-tool-select-variation" className="text-xs font-medium text-blue-500">
                Variation
              </label>
              <select
                id="ab-tester-debug-tool-select-variation"
                onChange={(e) => setVariationId(Number(e.target.value))}
                value={String(variationId)}
                className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value="null" disabled>
                  Select...
                </option>
                {campaignSelected.variations.map((variation) => (
                  <option key={variation.id} value={variation.id}>
                    {variation.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <label htmlFor="ab-tester-debug-tool-checkbox-ignore-requirements" className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              id="ab-tester-debug-tool-checkbox-ignore-requirements"
              checked={ignoreRequirements}
              onChange={(e) => setIgnoreRequirements(e.target.checked)}
              className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
            />
            <span className="text-sm font-medium text-gray-800">Ignore requirements</span>
          </label>

          <button
            type="button"
            disabled={campaignId === null || variationId === null}
            className="w-full mt-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white enabled:hover:bg-blue-700 enabled:active:bg-blue-800 transition-colors enabled:cursor-pointer disabled:opacity-50"
            onClick={applyChanges}
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
};

export default FloatingWidget;
