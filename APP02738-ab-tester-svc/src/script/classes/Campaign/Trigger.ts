import type { TypeAbTester } from '../../types';

type TypeTriggerData = TypeAbTester['campaignsData'][number]['triggers'][number];

class Trigger {
  trigger: TypeTriggerData;
  readonly idCampaign: number;

  constructor(trigger: TypeTriggerData, idCampaign: number) {
    this.trigger = trigger;
    this.idCampaign = idCampaign;
  }

  async setTrigger(): Promise<void> {
    const trigger = this.trigger;

    if (trigger.type === 'clickOnElement') {
      return new Promise((resolve) => {
        const selector = trigger.data.selector;

        const handler = (event: MouseEvent) => {
          if ((event.target as HTMLElement)?.closest(selector)) {
            window.removeEventListener('click', handler);
            resolve();
          }
        };

        window.addEventListener('click', handler);
      });
    }

    if (trigger.type === 'custom') {
      return Promise.resolve(trigger.data.javascript());
    }

    if (trigger.type === 'pageLoad') {
      return;
    }

    if (trigger.type === 'timeOnPage') {
      const timePassed = Date.now() - performance.timeOrigin;
      const remaining = Math.max(0, trigger.data.milliseconds - timePassed);

      return new Promise((resolve) => {
        setTimeout(resolve, remaining);
      });
    }

    throw new Error('Unknown trigger type');
  }
}

export default Trigger;
