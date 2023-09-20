const verifyOrigin = (
  secure: boolean,
  origin: string,
  expectedHost: string,
): boolean => {
  const [protocol, host] = origin.split('//', 2);
  return (!secure || protocol === 'https:') && host === expectedHost;
};

export default verifyOrigin;
