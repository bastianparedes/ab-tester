import type { TypeAbTester } from '../../types';
import { getId } from '../../utils/info';
import { seededRandomFromInputs } from '../../utils/random';
import { Audience } from '../Audience';
import Requirement from './Requirement';
import type Trigger from './Trigger';
import type Variation from './Variation';

type TypeRequirementData = TypeAbTester['campaignsData'][number]['requirements'];

class Campaign {
  id: number;
  name: string;
  private requirementData: TypeRequirementData;
  private triggers: Trigger[];
  private variations: Variation[];
  private firedOnce: boolean;
  requirementsWereMet: undefined | boolean;
  requirementsWereEvaluated: boolean;
  requirementsWereMetPromise: Promise<boolean>;
  private resolveRequirementsWereMet: (response: boolean) => void;
  private audiences: Audience[];

  constructor(id: number, name: string, requirementData: TypeRequirementData, triggers: Trigger[], variations: Variation[], audiences: Audience[]) {
    this.id = id;
    this.name = name;
    this.requirementData = requirementData;
    this.triggers = triggers;
    this.variations = variations;
    this.firedOnce = false;
    this.requirementsWereEvaluated = false;
    this.audiences = audiences;

    const { promise: requirementsWereMetPromise, resolve: resolveRequirementsWereMet } = Promise.withResolvers<boolean>();
    this.requirementsWereMetPromise = requirementsWereMetPromise.then((requirementsWereMet) => {
      this.requirementsWereMet = requirementsWereMet;
      return requirementsWereMet;
    });
    this.resolveRequirementsWereMet = resolveRequirementsWereMet;

    Promise.any(this.triggers.map((trigger) => trigger.setTrigger()))
      .then(() => this.evaluate())
      .catch(() => {});
  }

  async evaluate() {
    if (this.requirementData.data.children.length === 0) {
      this.requirementsWereEvaluated = true;
      this.resolveRequirementsWereMet(true);
      return true;
    }
    const result = await new Requirement(this.requirementData, this.audiences).evaluate();
    this.requirementsWereEvaluated = true;
    this.resolveRequirementsWereMet(result);
    return result;
  }

  getVariation() {
    const numberDecider = seededRandomFromInputs({ inputs: [getId(), this.id], max: 99, min: 0 });
    let accumulator = 0;
    return this.variations.find((variation) => {
      accumulator += variation.data.traffic;
      return accumulator >= numberDecider;
    });
  }

  async applyChanges() {
    if (this.firedOnce) return;
    this.firedOnce = true;

    const variation = this.getVariation();
    if (variation === undefined) return;

    console.info(`🚀 AB Tester - Fired Campaign: (ID: ${this.id}) ${this.name} - Variation: ${variation.data.name}`);

    await Promise.all(
      window.ab_tester.lifecycleHooksData.variantCampaignStart.map((hook) =>
        hook.javascript({ campaign: { id: this.id, name: this.name }, variation: { id: variation.data.id, name: variation.data.name } }),
      ),
    );
    variation.run();
    await Promise.all(
      window.ab_tester.lifecycleHooksData.variantCampaignEnd.map((hook) =>
        hook.javascript({ campaign: { id: this.id, name: this.name }, variation: { id: variation.data.id, name: variation.data.name } }),
      ),
    );
  }
}

export default Campaign;
