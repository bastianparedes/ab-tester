import type { TypeCampaignWithOptionalId, TypeVariationData } from '@ab-tester/constants/types/campaign';
import Monaco from '@monaco-editor/react';
import { useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { Modal } from '@/app/_common/components/Modal';
import { useTranslationContext } from '@/app/_common/contexts/Translation';

import 'react-tabs/style/react-tabs.css';
import { Pencil } from 'lucide-react';
import { jsCodeIsSingleAsyncArrowFunction } from '@/utils/jsCode';

interface Props {
  variation: TypeVariationData;
  setCampaign: (campaign: (TypeCampaign: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => void;
}

const Editor = ({ setCampaign, variation }: Props) => {
  const { translation } = useTranslationContext();
  const [showEditor, setShowEditor] = useState(false);
  const [html, setHtml] = useState(variation.html);
  const [css, setCss] = useState(variation.css);
  const [javascript, setJavascript] = useState(variation.javascript);

  const monacoConfig = {
    options: {
      minimap: {
        enabled: false,
      },
    },
    theme: 'vs-dark',
  };

  const monacoHtmlConfig = {
    onChange: (html: string | undefined) => {
      setHtml(html ?? '');
    },
    value: html,
  };

  const monacoCssConfig = {
    onChange: (css: string | undefined) => {
      setCss(css ?? '');
    },
    value: css,
  };

  const monacoJavascriptConfig = {
    onChange: (javascript: string | undefined) => {
      setJavascript(javascript ?? '');
    },
    value: javascript,
  };

  const onSave = () => {
    setCampaign((campaign) => {
      variation.html = html;
      variation.css = css;
      variation.javascript = javascript;

      return structuredClone(campaign);
    });
    setShowEditor(false);
  };

  const onCloseModal = () => {
    setHtml(variation.html);
    setCss(variation.css);
    setJavascript(variation.javascript);
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:enabled:bg-blue-700 transition-colors disabled:opacity-80 disabled:cursor-not-allowed"
              onClick={onSave}
            >
              {translation.campaign.save}
            </button>
            <Tabs>
              <TabList>
                <Tab>HTML</Tab>
                <Tab>CSS</Tab>
                <Tab>JavaScript</Tab>
              </TabList>
              <TabPanel>
                <div className="w-[80vw] h-[80vh]">
                  <Monaco {...monacoConfig} {...monacoHtmlConfig} language="html" />
                </div>
              </TabPanel>
              <TabPanel>
                <div className="w-[80vw] h-[80vh]">
                  <Monaco {...monacoConfig} {...monacoCssConfig} language="css" />
                </div>
              </TabPanel>
              <TabPanel>
                <div className="w-[80vw] h-[80vh]">
                  <Monaco {...monacoConfig} {...monacoJavascriptConfig} language="javascript" />
                </div>
              </TabPanel>
            </Tabs>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Editor;
