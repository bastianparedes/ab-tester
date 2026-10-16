const get = ({ name }: { name: string }) => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, value] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
};

const set = ({
  name,
  value,
  exdays,
  path = '/',
  domain = window.location.hostname,
}: {
  name: string;
  value: string | number;
  exdays: number;
  path?: string;
  domain?: string;
}) => {
  const date = new Date();
  date.setTime(date.getTime() + 1000 * 60 * 60 * 24 * exdays);
  const expires = date.toUTCString();
  document.cookie = `${name}=${value};expires=${expires};path=${path};domain=${domain}`;
};

const remove = ({ name }: { name: string }) => {
  set({ exdays: -1, name, value: '' });
};

const cookie = { get, remove, set };

export default cookie;
