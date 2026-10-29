import type { TypeAudienceScript } from '@ab-tester/constants/types/script';
import { comparatorResolver } from '../../../utils/comparatorResolver';
import { indexedDBCrud } from '../../IndexedDB';
import { filterByDate } from './dateComparator';

const requirementString = async (requirement: Extract<TypeAudienceScript['requirements']['data']['children'][number], { type: 'string' }>) => {
  const array = await indexedDBCrud.getAll<string>(requirement.data.trackEventId);
  const arrayFilteredByDate = filterByDate({
    items: array,
    timeUnit: requirement.data.timeUnit,
    value: requirement.data.timeAmount,
  });
  const arrayFilterByRestriction = arrayFilteredByDate.filter((element) => {
    return comparatorResolver({
      comparator: requirement.data.comparator,
      expectedValue: element.value,
      obtainedValue: requirement.data.value,
    });
  });
  return comparatorResolver({
    comparator: requirement.data.quantityOperator,
    expectedValue: requirement.data.eventCount,
    obtainedValue: arrayFilterByRestriction.length,
  });
};

const requirementNumber = async (requirement: Extract<TypeAudienceScript['requirements']['data']['children'][number], { type: 'number' }>) => {
  const array = await indexedDBCrud.getAll<number>(requirement.data.trackEventId);
  const arrayFilteredByDate = filterByDate({
    items: array,
    timeUnit: requirement.data.timeUnit,
    value: requirement.data.timeAmount,
  });
  const arrayFilterByRestriction = arrayFilteredByDate.filter((element) => {
    return comparatorResolver({
      comparator: requirement.data.comparator,
      expectedValue: element.value,
      obtainedValue: requirement.data.value,
    });
  });
  return comparatorResolver({
    comparator: requirement.data.quantityOperator,
    expectedValue: requirement.data.eventCount,
    obtainedValue: arrayFilterByRestriction.length,
  });
};

const requirementBoolean = async (requirement: Extract<TypeAudienceScript['requirements']['data']['children'][number], { type: 'boolean' }>) => {
  const array = await indexedDBCrud.getAll<boolean>(requirement.data.trackEventId);
  const arrayFilteredByDate = filterByDate({
    items: array,
    timeUnit: requirement.data.timeUnit,
    value: requirement.data.timeAmount,
  });
  const arrayFilterByRestriction = arrayFilteredByDate.filter((element) => {
    return comparatorResolver({
      comparator: requirement.data.comparator,
      expectedValue: Number(element.value),
      obtainedValue: Number(requirement.data.value),
    });
  });
  return comparatorResolver({
    comparator: requirement.data.quantityOperator,
    expectedValue: requirement.data.eventCount,
    obtainedValue: arrayFilterByRestriction.length,
  });
};

const requirementAny = async (requirement: Extract<TypeAudienceScript['requirements']['data']['children'][number], { type: 'any' }>) => {
  const array = await indexedDBCrud.getAll<boolean>(requirement.data.trackEventId);
  const arrayFilteredByDate = filterByDate({
    items: array,
    timeUnit: requirement.data.timeUnit,
    value: requirement.data.timeAmount,
  });

  return comparatorResolver({
    comparator: requirement.data.quantityOperator,
    expectedValue: requirement.data.eventCount,
    obtainedValue: arrayFilteredByDate.length,
  });
};

// Evaluate node requirement (combines multiple child requirements)
const requirementNode = async (requirement: Extract<TypeAudienceScript['requirements']['data']['children'][number], { type: 'node' }>): Promise<boolean> => {
  const booleanPromises = requirement.data.children.map((childData) => {
    const requirementStrategies = {
      any: () => requirementAny(childData as Extract<TypeAudienceScript['requirements']['data']['children'][number], { type: 'any' }>),
      boolean: () => requirementBoolean(childData as Extract<TypeAudienceScript['requirements']['data']['children'][number], { type: 'boolean' }>),
      node: () => requirementNode(childData as Extract<TypeAudienceScript['requirements']['data']['children'][number], { type: 'node' }>),
      number: () => requirementNumber(childData as Extract<TypeAudienceScript['requirements']['data']['children'][number], { type: 'number' }>),
      string: () => requirementString(childData as Extract<TypeAudienceScript['requirements']['data']['children'][number], { type: 'string' }>),
    };
    const strategy = requirementStrategies[childData.type];
    return strategy();
  });

  const booleans = await Promise.all(booleanPromises);

  // Evaluate combined result based on operator
  const operator = requirement.data.operator;
  if (operator === 'and') return booleans.every(Boolean);
  if (operator === 'or') return booleans.some(Boolean);
  return false;
};

// ------------------------------
// Main Requirement class
// ------------------------------
class Requirement {
  readonly requirementData: Extract<TypeAudienceScript['requirements'], { type: 'node' }>;

  constructor(requirementData: Extract<TypeAudienceScript['requirements'], { type: 'node' }>) {
    this.requirementData = requirementData;
  }

  // Evaluate the root requirement node
  async evaluate() {
    return requirementNode(this.requirementData).catch(() => false);
  }
}

export default Requirement;
