import { initCampaigns } from './processes/initCampaigns';
import { setTrackEvents } from './processes/setTrackEvents';
import type { TypeAbTester } from './types';

declare global {
  interface Window {
    ab_tester: TypeAbTester;
  }
}

const script = async () => {
  await Promise.all(window.ab_tester.lifecycleHooksData.scriptStart.map((hook) => hook.javascript({})));
  await setTrackEvents();
  initCampaigns();
  await Promise.all(window.ab_tester.lifecycleHooksData.scriptEnd.map((hook) => hook.javascript({})));
};

script();
