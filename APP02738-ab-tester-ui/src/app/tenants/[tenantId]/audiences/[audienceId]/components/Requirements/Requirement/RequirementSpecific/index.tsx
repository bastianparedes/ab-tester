import type { TypeAudienceWithOptionalId } from '@ab-tester/constants/types/audience';
import BooleanComponent from './BooleanComponent';
import NumberComponent from './NumberComponent';
import StringComponent from './StringComponent';

interface Props {
  requirement: Exclude<TypeAudienceWithOptionalId['requirements']['data']['children'][number], { type: 'node' }>;
  setAudience: (audience: (TypeAudience: TypeAudienceWithOptionalId) => TypeAudienceWithOptionalId) => void;
}

const Element = ({ setAudience, requirement }: Props) => {
  if (requirement.type === 'string') return <StringComponent setAudience={setAudience} requirement={requirement} />;
  if (requirement.type === 'number') return <NumberComponent setAudience={setAudience} requirement={requirement} />;
  if (requirement.type === 'boolean') return <BooleanComponent setAudience={setAudience} requirement={requirement} />;
  if (requirement.type === 'any') return null;

  return null;
};

export default Element;
