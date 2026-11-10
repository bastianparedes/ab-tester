import type { TypeCampaignWithOptionalId, TypeVariationData } from '@ab-tester/constants/types/campaign';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import Editor from './Editor';
import { variationsWithDistributedTraffic } from './util';

const javascript = `
/* ############ WRITE NEW CODE ONLY INSIDE OF THIS async arrow function ############ */

async () => {
  /* write your code here */
}
`;

interface Props {
  variations: TypeVariationData[];
  setCampaign: (campaign: (TypeCampaign: TypeCampaignWithOptionalId) => TypeCampaignWithOptionalId) => void;
}

const Variations = ({ setCampaign, variations }: Props) => {
  const { translation } = useTranslationContext();
  const addNewVariation = () => {
    setCampaign((campaign) => {
      const newCampaign = structuredClone(campaign);
      const newIdVariation = variations.reduce((highest, nextVariation) => Math.max(highest, nextVariation.id), 0) + 1;

      newCampaign.variations.push({
        css: '',
        html: '',
        id: newIdVariation,
        javascript,
        name: `Variation ${String(newIdVariation)}`,
        traffic: 0,
      });

      newCampaign.variations = variationsWithDistributedTraffic(newCampaign.variations);

      return newCampaign;
    });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-blue-900">{translation.campaign.variationsTitle}</h2>
        <button type="button" onClick={addNewVariation} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={18} />
          {translation.campaign.newVariation}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-blue-100">
              <th className="text-left py-3 px-4 text-blue-900 font-semibold">{translation.campaign.id}</th>
              <th className="text-left py-3 px-4 text-blue-900 font-semibold">{translation.campaign.name}</th>
              <th className="text-left py-3 px-4 text-blue-900 font-semibold">{translation.campaign.traffic}</th>
              <th className="text-right py-3 px-4 text-blue-900 font-semibold">{translation.campaign.actions}</th>
            </tr>
          </thead>
          <tbody>
            {variations.map((variation, index) => (
              <tr key={variation.id} className="border-b border-blue-50 transition-colors">
                <td className="py-4 px-4 text-blue-900">{index + 1}</td>
                <td className="py-4 px-4">
                  <input
                    type="text"
                    value={variation.name}
                    onChange={(event) => {
                      setCampaign((campaign) => {
                        variation.name = event.target.value;
                        return structuredClone(campaign);
                      });
                    }}
                    className="px-3 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 w-full"
                  />
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={variation.traffic}
                      onChange={(event) => {
                        const valueAsNumber = Math.round(event.target.valueAsNumber);
                        let newTraffic = Number.isNaN(valueAsNumber) ? 0 : valueAsNumber;
                        newTraffic = Math.trunc(newTraffic);
                        if (newTraffic < 0) newTraffic = 0;
                        else if (newTraffic > 100) newTraffic = 100;
                        event.target.value = String(newTraffic);
                        variation.traffic = newTraffic;
                        setCampaign((campaign) => {
                          return structuredClone(campaign);
                        });
                      }}
                      className="px-3 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 w-24"
                    />
                    <span className="text-blue-600">%</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Editor setCampaign={setCampaign} variation={variation} />
                    <button
                      type="button"
                      onClick={() => {
                        setCampaign((campaign) => {
                          campaign.variations = campaign.variations.filter((variationInList) => variationInList.id !== variation.id);

                          campaign.variations = variationsWithDistributedTraffic(campaign.variations);

                          return structuredClone(campaign);
                        });
                      }}
                      className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Variations;
