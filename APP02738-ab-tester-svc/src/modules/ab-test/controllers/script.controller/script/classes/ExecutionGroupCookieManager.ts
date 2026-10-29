import cookieUtils from '../utils/cookie';

type CookieValue = {
  executionGroups: {
    [key: string | number]:
      | undefined
      | {
          campaignsExecuted?: number[];
        };
  };
};

export class ExecutionGroupCookieManager {
  private cookieName = 'ab_tester_register_execution_groups_v1';
  executionGoupId: number;

  constructor(executionGoupId: number) {
    this.executionGoupId = executionGoupId;
  }

  private saveInCookies(object: CookieValue) {
    cookieUtils.set({ exdays: 365, name: this.cookieName, value: JSON.stringify(object) });
  }

  private setDefault() {
    const defaultValue: CookieValue = { executionGroups: {} };
    this.saveInCookies(defaultValue);
    return defaultValue;
  }

  private getCookieValue(): CookieValue {
    try {
      const cookieValue = cookieUtils.get({ name: this.cookieName });
      if (!cookieValue) throw new Error();

      const object: CookieValue = JSON.parse(cookieValue);
      return object;
    } catch {
      return this.setDefault();
    }
  }

  insertCampaignId(campaignId: number): CookieValue {
    try {
      const cookieValue = this.getCookieValue();
      if (!cookieValue.executionGroups) cookieValue.executionGroups = {};
      if (!cookieValue.executionGroups[this.executionGoupId]) cookieValue.executionGroups[this.executionGoupId] = {};
      if (!cookieValue.executionGroups[this.executionGoupId]?.campaignsExecuted) cookieValue.executionGroups[this.executionGoupId]!.campaignsExecuted = [];
      if (!cookieValue.executionGroups[this.executionGoupId]!.campaignsExecuted!.includes(campaignId))
        cookieValue.executionGroups[this.executionGoupId]!.campaignsExecuted!.push(campaignId);
      this.saveInCookies(cookieValue);

      return cookieValue;
    } catch {
      const object: CookieValue = {
        executionGroups: {
          [this.executionGoupId]: {
            campaignsExecuted: [campaignId],
          },
        },
      };
      this.saveInCookies(object);
      return object;
    }
  }

  deleteCampaignId(campaignId: number): CookieValue {
    try {
      const cookieValue = this.getCookieValue();
      if (!cookieValue.executionGroups) cookieValue.executionGroups = {};
      if (!cookieValue.executionGroups[this.executionGoupId]) cookieValue.executionGroups[this.executionGoupId] = {};
      if (!cookieValue.executionGroups[this.executionGoupId]?.campaignsExecuted) cookieValue.executionGroups[this.executionGoupId]!.campaignsExecuted = [];
      cookieValue.executionGroups[this.executionGoupId]!.campaignsExecuted! = cookieValue.executionGroups[this.executionGoupId]!.campaignsExecuted!.filter(
        (campaignIdInArray) => campaignIdInArray !== campaignId,
      );
      this.saveInCookies(cookieValue);

      return cookieValue;
    } catch {
      const object: CookieValue = {
        executionGroups: {
          [this.executionGoupId]: {
            campaignsExecuted: [],
          },
        },
      };
      this.saveInCookies(object);
      return object;
    }
  }

  getCampaignIds(): number[] {
    try {
      const object = this.getCookieValue();
      const campaignIds = object.executionGroups[this.executionGoupId]?.campaignsExecuted ?? [];
      return campaignIds;
    } catch {
      const object: CookieValue = {
        executionGroups: {
          [this.executionGoupId]: {
            campaignsExecuted: [],
          },
        },
      };
      this.saveInCookies(object);
      return [];
    }
  }
}
