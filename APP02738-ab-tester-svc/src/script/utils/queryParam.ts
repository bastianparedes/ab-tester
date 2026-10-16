const get = (name: string) => {
  const queryParams = new URLSearchParams(location.search);
  if (queryParams.has(name)) return queryParams.get(name);
  return null;
};

const queryParam = {
  get,
};

export default queryParam;
