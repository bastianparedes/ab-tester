'use client';

import type { TypeAudienceWithOptionalId } from '@ab-tester/constants/types/audience';
import type { TypeTrackEventForAudience } from '@ab-tester/constants/types/trackEvents';
import { useState } from 'react';
import { Button } from '@/app/_common/components/button';
import { FormSection } from '@/app/_common/components/FormSection';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import constants, { getStringPermission } from '@/config/constants';
import { apiCaller } from '@/libs/restClient';
import Requirements from './components/Requirements';

type Props = {
  initialAudience: TypeAudienceWithOptionalId;
  tenantId: number;
  trackEvents: TypeTrackEventForAudience[];
};

const ClientPage = ({ initialAudience, tenantId, trackEvents }: Props) => {
  const { translation } = useTranslationContext();
  const [audience, setAudience] = useState(initialAudience);

  const user = useUser();

  const isNewAudience = audience.id === undefined;

  const returnToAudiences = () => {
    location.href = constants.pages.audiences({ tenantId });
  };

  const handleOnSave = async () => {
    if (audience.id === undefined) {
      await apiCaller.audiences.create({
        body: audience,
        pathParams: { tenantId },
      });
    } else {
      await apiCaller.audiences.update({
        body: audience,
        pathParams: { audienceId: audience.id, tenantId },
      });
    }
    returnToAudiences();
  };

  return (
    <div className="w-9/10 mx-auto my-8 relative flex flex-col gap-8">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-blue-900 mb-2">{translation.audience.title}</h1>
            <p className="text-blue-600">{translation.audience.description}</p>
          </div>
        </div>
      </div>

      {/* NAME */}
      <FormSection>
        <h2 className="text-xl font-semibold text-blue-900 mb-4">{translation.audience.name}</h2>
        <input
          type="text"
          value={audience.name}
          onChange={(e) => setAudience({ ...audience, name: e.target.value })}
          className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
        />
      </FormSection>

      {trackEvents.length > 0 && <Requirements requirements={audience.requirements} setAudience={setAudience} trackEvents={trackEvents} />}

      <div className="mt-8 flex justify-end gap-4">
        <Button onClick={returnToAudiences} variant="destructive">
          Cancel
        </Button>
        {((isNewAudience && user.permissions.includes(getStringPermission({ action: 'create', feature: 'audience', tenantId }))) ||
          (!isNewAudience && user.permissions.includes(getStringPermission({ action: 'update', feature: 'audience', tenantId })))) && (
          <Button onClick={handleOnSave} variant="default">
            Save Audience
          </Button>
        )}
      </div>
    </div>
  );
};

export { ClientPage };
