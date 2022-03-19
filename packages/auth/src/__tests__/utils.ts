// eslint-disable-next-line import/prefer-default-export
export const getCookies = (res) => {
  let setCookieHeaders = res.getHeader('Set-Cookie');
  if (typeof setCookieHeaders === 'string') {
    setCookieHeaders = [setCookieHeaders];
  }

  const cookies = new Map();
  for (const header of setCookieHeaders) {
    const [cookiePair, ...directives] = header.split(/;\s*/);
    const [key, value] = cookiePair.split('=', 2);
    cookies.set(key, {
      value,
      directives: directives.sort().join('; '),
    });
  }

  return cookies;
};
