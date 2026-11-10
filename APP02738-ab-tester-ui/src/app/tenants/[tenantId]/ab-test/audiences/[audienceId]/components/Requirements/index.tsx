import type { TypeAudienceWithOptionalId } from '@ab-tester/constants/types/audience';
import { TypeTrackEventForAudience } from '@ab-tester/constants/types/trackEvents';
import { FormSection } from '@/app/_common/components/FormSection';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import Requirement from './Requirement';

interface Props {
  requirements: TypeAudienceWithOptionalId['requirements'];
  setAudience: (audience: (TypeCampaign: TypeAudienceWithOptionalId) => TypeAudienceWithOptionalId) => void;
  trackEvents: TypeTrackEventForAudience[];
}

const Requirements = ({ setAudience, requirements, trackEvents }: Props) => {
  const { translation } = useTranslationContext();

  return (
    <FormSection>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-blue-900">{translation.audience.requirementsTitle}</h2>
      </div>
      <Requirement grandParentNode={null} id="0" index={0} parentNode={null} requirement={requirements} setAudience={setAudience} trackEvents={trackEvents} />
    </FormSection>
  );
};

export default Requirements;
