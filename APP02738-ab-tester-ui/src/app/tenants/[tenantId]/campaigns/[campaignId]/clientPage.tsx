'use client';

import { TypeAudienceForCampaign } from '@ab-tester/constants/types/audience';
import type { TypeCampaignWithOptionalId } from '@ab-tester/constants/types/campaign';
import type { TypeUser } from '@ab-tester/constants/types/user';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Button } from '@/app/_common/components/button';
import { FormSection } from '@/app/_common/components/FormSection';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import constants from '@/config/constants';
import commonConstants from '@/config/sharedConstants';
import { env } from '@/libs/env';
import { apiCaller } from '@/libs/restClient';
import { LiveViewersNavbar } from './components/LiveViewersBar';
import Requirements from './components/Requirements';
import Triggers from './components/Triggers';
import Variations from './components/Variations';

type Props = {
  initialCampaign: TypeCampaignWithOptionalId;
  tenantId: number;
  campaignId: number | undefined;
  audiences: TypeAudienceForCampaign[];
};

const ClientPage = ({ initialCampaign, tenantId, campaignId, audiences }: Props) => {
  const { translation } = useTranslationContext();
  const [campaign, setCampaign] = useState(initialCampaign);
  const socketRef = useRef<Socket | null>(null);
  const [usersWatching, setUsersWatching] = useState<{ id: TypeUser['id']; name: TypeUser['name'] }[]>([]);
  const [userMadeChange, setUserMadeChange] = useState<{ id: TypeUser['id']; name: TypeUser['name']; date: Date } | null>(null);

  const user = useUser();

  const isNewCampaign = campaign.id === undefined;

  const returnToCampaigns = () => {
    location.href = constants.pages.campaigns({ tenantId: campaign.tenantId });
  };

  const handleOnSave = async () => {
    if (campaign.id === undefined) {
      await apiCaller.campaigns.create({
        body: campaign,
        pathParams: { tenantId: campaign.tenantId },
      });
    } else {
      notifyUsersCampaignWasUpdated();
      await apiCaller.campaigns.update({
        body: campaign,
        pathParams: { campaignId: campaign.id, tenantId: campaign.tenantId },
      });
    }
    returnToCampaigns();
  };

  const sumVariationTrafficsIs100 = campaign.variations.reduce((acc, variation) => acc + variation.traffic, 0) === 100;

  useEffect(() => {
    const socket = io(`${env.NEXT_PUBLIC_BACKEND_URL_FROM_CLIENT_SIDE}/gateways/campaigns`, {
      auth: {
        campaignId,
        tenantId,
      },
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('update-users-watching-campaign', (users) => {
      setUsersWatching(users);
    });

    socket.on('user-updated-campaign', (user) => {
      setUserMadeChange({ ...user, date: new Date() });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const notifyUsersCampaignWasUpdated = () => {
    socketRef.current?.emit('user-updated-campaign', { campaignId, tenantId });
  };

  return (
    <>
      {campaignId !== undefined && <LiveViewersNavbar usersWatching={usersWatching} userMadeChange={userMadeChange} />}
      <div className="w-9/10 mx-auto my-8 relative flex flex-col gap-8">
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-blue-900 mb-2">{translation.campaign.title}</h1>
              <p className="text-blue-600">{translation.campaign.description}</p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <select
                  value={campaign.status}
                  onChange={(e) =>
                    setCampaign({
                      ...campaign,
                      status: e.target.value as typeof campaign.status,
                    })
                  }
                  className={`outline-none px-6 py-2 rounded-lg font-semibold transition-all shadow-md appearance-none cursor-pointer pr-10 ${
                    campaign.status === 'active'
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : campaign.status === 'inactive'
                        ? 'bg-gray-400 text-white hover:bg-gray-500'
                        : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {commonConstants.arrayStatusArray.map((status) => (
                    <option key={status} value={status}>
                      {translation.common[status]}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white">
                  <ChevronDown />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NAME */}
        <FormSection>
          <h2 className="text-xl font-semibold text-blue-900 mb-4">{translation.campaign.name}</h2>
          <input
            type="text"
            value={campaign.name}
            onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          />
        </FormSection>

        <FormSection>
          <Triggers triggers={campaign.triggers} setCampaign={setCampaign} />
        </FormSection>

        <FormSection>
          <Requirements requirements={campaign.requirements} setCampaign={setCampaign} audiences={audiences} />
        </FormSection>

        <FormSection>
          <Variations setCampaign={setCampaign} variations={campaign.variations} />
        </FormSection>

        <div className="mt-8 flex justify-end gap-4">
          <Button onClick={returnToCampaigns} variant="destructive">
            Cancel
          </Button>
          {((isNewCampaign && user.hasPermission({ action: 'create', feature: 'campaign', tenantId })) ||
            (!isNewCampaign && user.hasPermission({ action: 'update', feature: 'campaign', tenantId }))) && (
            <Button disabled={!!userMadeChange || !sumVariationTrafficsIs100} onClick={handleOnSave} variant="default">
              Save Campaign
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export { ClientPage };
