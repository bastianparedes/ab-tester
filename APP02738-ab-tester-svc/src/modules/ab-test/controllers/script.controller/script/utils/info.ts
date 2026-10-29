import constants from '../config/constants';
import cookie from './cookie';
import { getRandomIntegerNumber } from './random';

const getId = () => {
  const cookieName = constants.cookie.name;
  const value = cookie.get({ name: cookieName });
  const savedValueIsNumber = value !== null && /^-?\d+$/.test(value);
  const id = savedValueIsNumber ? parseInt(value, 10) : getRandomIntegerNumber(constants.cookie.min, constants.cookie.max);
  cookie.set({
    exdays: constants.cookie.duration,
    name: constants.cookie.name,
    value: id,
  });
  return id;
};

export { getId };
