import { Audience } from '../../classes/Audience';
import Campaign from '../../classes/Campaign';
import Trigger from '../../classes/Campaign/Trigger';
import Variation from '../../classes/Campaign/Variation';
import { TypeAbTester } from '../../types';

declare global {
  interface Window {
    ab_tester: TypeAbTester;
  }
}

const audiences = window.ab_tester.audiencesData.map(
  (audienceData) =>
    new Audience({
      id: audienceData.id,
      name: audienceData.name,
      requirementData: audienceData.requirements,
    }),
);

type TypeCampaignId = TypeAbTester['campaignsData'][number]['id'];
type TypeVariationId = TypeAbTester['campaignsData'][number]['variations'][number]['id'];

export const initSpecificCampaign = ({
  campaignId,
  variationId,
  ignoreRequirements,
}: {
  campaignId: TypeCampaignId;
  variationId: TypeVariationId;
  ignoreRequirements: boolean;
}) => {
  const campaignData = window.ab_tester.campaignsData.find((campaignData) => campaignData.id === campaignId);
  if (!campaignData) return;

  const variationData = campaignData.variations.find((variationData) => variationData.id === variationId);
  if (!variationData) return;

  const newCampaignData = { ...campaignData, variations: [{ ...variationData, traffic: 100 }] };

  const triggers = newCampaignData.triggers.map((triggerData) => new Trigger(triggerData, newCampaignData.id));
  const variations = newCampaignData.variations.map((variationData) => new Variation(variationData, newCampaignData.id));
  const campaign = new Campaign(newCampaignData.id, newCampaignData.name, newCampaignData.requirements, triggers, variations, audiences);

  campaign.requirementsWereMetPromise.then((requirementsWereMet) => {
    if (requirementsWereMet || ignoreRequirements) campaign.applyChanges();
  });
};
