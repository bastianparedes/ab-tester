export const getRandomIntegerNumber = (min: number, max: number) => {
  const range = max - min + 1;
  const randomBytes = new Uint32Array(1);
  crypto.getRandomValues(randomBytes);
  return (randomBytes[0] % range) + min;
};

export const getRandomFromArray = <T>(array: T[]): T | undefined => {
  const element = array[getRandomIntegerNumber(0, array.length - 1)];
  return element;
};

export const seededRandomFromInputs = ({ inputs, min, max }: { inputs: number[]; min: number; max: number }): number => {
  // min and max are included in result;
  let seed = 0;
  for (let i = 0; i < inputs.length; i++) {
    seed ^= inputs[i] + 0x9e3779b9 + (seed << 6) + (seed >> 2);
  }

  seed = seed ^ 61 ^ (seed >>> 16);
  seed = seed + (seed << 3);
  seed = seed ^ (seed >>> 4);
  seed = seed * 0x27d4eb2d;
  seed = seed ^ (seed >>> 15);

  const range = max - min + 1;
  return min + (Math.abs(seed) % range);
};
