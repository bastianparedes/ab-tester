import { TypeAudienceScript } from '@ab-tester/constants/types/script';
import Requirement from './Requirement';

export class Audience {
  id: TypeAudienceScript['id'];
  name: TypeAudienceScript['name'];
  private requirementData: TypeAudienceScript['requirements'];
  private userIsInThisAudience: boolean | undefined = undefined;

  constructor(audienceData: { id: TypeAudienceScript['id']; name: TypeAudienceScript['name']; requirementData: TypeAudienceScript['requirements'] }) {
    this.id = audienceData.id;
    this.name = audienceData.name;
    this.requirementData = audienceData.requirementData;
  }

  async evaluate() {
    if (this.userIsInThisAudience !== undefined) return this.userIsInThisAudience;

    const result = await new Requirement(this.requirementData).evaluate();
    this.userIsInThisAudience = result;
    return result;
  }
}
