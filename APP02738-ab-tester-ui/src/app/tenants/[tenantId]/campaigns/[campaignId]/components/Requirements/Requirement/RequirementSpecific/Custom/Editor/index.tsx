import type { TypeCampaignWithOptionalId, TypeCustomRequirement } from '@ab-tester/constants/types/campaign';
import Monaco from '@monaco-editor/react';
import { useState } from 'react';
import { Modal } from '@/app/_common/components/Modal';
import { useTranslationContext } from '@/app/_common/contexts/Translation';

import 'react-tabs/style/react-tabs.css';
import { Pencil } from 'lucide-react';
import { jsCodeIsSingleAsyncArrowFunction } from '@/utils/jsCode';

interface Props {
  requirement: TypeCustomRequirement;
  setCampaign: (campaign: (TypeCampaign: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => void;
}

const Editor = ({ setCampaign, requirement }: Props) => {
  const { translation } = useTranslationContext();
  const [showEditor, setShowEditor] = useState(false);
  const [javascript, setJavascript] = useState(String(requirement.data.javascript));

  const monacoConfig = {
    options: {
      minimap: {
        enabled: false,
      },
    },
    theme: 'vs-dark',
  };

  const monacoJavascriptConfig = {
    onChange: (javascript: string | undefined) => {
      setJavascript(javascript ?? '');
    },
    value: javascript,
  };

  const onSave = () => {
    setCampaign((campaign) => {
      requirement.data.javascript = javascript;

      return structuredClone(campaign);
    });
    setShowEditor(false);
  };

  const onCloseModal = () => {
    setJavascript(requirement.data.javascript);
    setShowEditor(false);
  };

  return (
    <>
      <button type="button" className="p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => setShowEditor(true)}>
        <Pencil size={20} />
      </button>
      {showEditor && (
        <Modal setModalVisible={() => onCloseModal()}>
          <div className="flex flex-col items-start gap-4 p-4">
            <button
              disabled={!jsCodeIsSingleAsyncArrowFunction(javascript)}
              type="button"
              onClick={onSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:enbaled:bg-blue-700 transition-colors disabled:opacity-80 disabled:cursor-not-allowed"
            >
              {translation.campaign.save}
            </button>
            <div className="w-[80vw] h-[80vh]">
              <Monaco {...monacoConfig} {...monacoJavascriptConfig} language="javascript" />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Editor;
