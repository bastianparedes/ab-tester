type TypeObtainedValue = string | number | null | undefined;
type TypeExpectedValue = string | number | undefined;

const strategyAtLeast = ({ obtainedValue, expectedValue }: { obtainedValue: TypeObtainedValue; expectedValue: TypeExpectedValue }) =>
  typeof obtainedValue === 'number' && typeof expectedValue === 'number' && obtainedValue >= expectedValue;

const strategyAtMost = ({ obtainedValue, expectedValue }: { obtainedValue: TypeObtainedValue; expectedValue: TypeExpectedValue }) =>
  typeof obtainedValue === 'number' && typeof expectedValue === 'number' && obtainedValue <= expectedValue;

const strategyLessThan = ({ obtainedValue, expectedValue }: { obtainedValue: TypeObtainedValue; expectedValue: TypeExpectedValue }) =>
  typeof obtainedValue === 'number' && typeof expectedValue === 'number' && obtainedValue < expectedValue;

const strategyMoreThan = ({ obtainedValue, expectedValue }: { obtainedValue: TypeObtainedValue; expectedValue: TypeExpectedValue }) =>
  typeof obtainedValue === 'number' && typeof expectedValue === 'number' && obtainedValue > expectedValue;

const strategyContains = ({ obtainedValue, expectedValue }: { obtainedValue: TypeObtainedValue; expectedValue: TypeExpectedValue }) =>
  typeof obtainedValue === 'string' && typeof expectedValue === 'string' && obtainedValue.includes(expectedValue);

const strategyDoesNotContain = ({ obtainedValue, expectedValue }: { obtainedValue: TypeObtainedValue; expectedValue: TypeExpectedValue }) =>
  typeof obtainedValue === 'string' && typeof expectedValue === 'string' && !obtainedValue.includes(expectedValue);

const strategyIs = ({ obtainedValue, expectedValue }: { obtainedValue: TypeObtainedValue; expectedValue: TypeExpectedValue }) =>
  ((typeof obtainedValue === 'string' && typeof expectedValue === 'string') || (typeof obtainedValue === 'number' && typeof expectedValue === 'number')) &&
  obtainedValue === expectedValue;

const strategyIsNot = ({ obtainedValue, expectedValue }: { obtainedValue: TypeObtainedValue; expectedValue: TypeExpectedValue }) =>
  typeof obtainedValue === 'string' && typeof expectedValue === 'string' && obtainedValue !== expectedValue;

const strategyDoesNotExist = ({ obtainedValue }: { obtainedValue: TypeObtainedValue; expectedValue?: never }) => obtainedValue === null || obtainedValue === undefined;

const strategyExists = ({ obtainedValue }: { obtainedValue: TypeObtainedValue; expectedValue?: never }) => obtainedValue !== null && obtainedValue !== undefined;

export const comparatorResolver = (
  data:
    | {
        comparator: 'atLeast' | 'atMost' | 'equal' | 'lessThan' | 'moreThan';
        obtainedValue: number;
        expectedValue: number;
      }
    | {
        comparator: 'contains' | 'doesNotContain' | 'equal' | 'isNot' | 'doesNotExist' | 'exists';
        obtainedValue: string | null | undefined;
        expectedValue: string | undefined;
      },
) => {
  const strategies = {
    atLeast: () =>
      strategyAtLeast({
        expectedValue: data.expectedValue,
        obtainedValue: data.obtainedValue,
      }),
    atMost: () =>
      strategyAtMost({
        expectedValue: data.expectedValue,
        obtainedValue: data.obtainedValue,
      }),
    contains: () =>
      strategyContains({
        expectedValue: data.expectedValue,
        obtainedValue: data.obtainedValue,
      }),
    doesNotContain: () =>
      strategyDoesNotContain({
        expectedValue: data.expectedValue,
        obtainedValue: data.obtainedValue,
      }),
    doesNotExist: () => strategyDoesNotExist({ obtainedValue: data.obtainedValue }),
    equal: () =>
      strategyIs({
        expectedValue: data.expectedValue,
        obtainedValue: data.obtainedValue,
      }),
    exists: () => strategyExists({ obtainedValue: data.obtainedValue }),
    isNot: () =>
      strategyIsNot({
        expectedValue: data.expectedValue,
        obtainedValue: data.obtainedValue,
      }),
    lessThan: () =>
      strategyLessThan({
        expectedValue: data.expectedValue,
        obtainedValue: data.obtainedValue,
      }),
    moreThan: () =>
      strategyMoreThan({
        expectedValue: data.expectedValue,
        obtainedValue: data.obtainedValue,
      }),
  };
  const strategy = strategies[data.comparator];
  const result = strategy();
  return result;
};
