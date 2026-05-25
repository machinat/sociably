// eslint-disable-next-line import/prefer-default-export
export const getCookies = (
  res: Pick<import('http').ServerResponse, 'getHeader'>,
) => {
  let setCookieHeaders = res.getHeader('Set-Cookie');
  if (
    typeof setCookieHeaders === 'number' ||
    typeof setCookieHeaders === 'undefined'
  ) {
    setCookieHeaders = [];
  } else if (typeof setCookieHeaders === 'string') {
    setCookieHeaders = [setCookieHeaders];
  }

  const cookies = new Map<
    string,
    {
      value: string;
      directives: string;
    }
  >();
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
