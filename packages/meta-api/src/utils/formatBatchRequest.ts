import { parse as parseUrl, format as formatUrl } from 'url';
import { encode as encodeQueryString } from 'querystring';
import { MetaBatchRequest, MetaApiJobRequest } from '../types.js';

const formatQueryParams = (queryParams: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(queryParams)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [
        key,
        typeof value === 'string' || typeof value === 'number'
          ? value.toString()
          : JSON.stringify(value),
      ]),
  );

const formatUrlWithQuery = (
  relativeUrl: string,
  queryParams: Record<string, unknown>,
): string => {
  const parsedUrl = parseUrl(relativeUrl, true);
  return formatUrl({
    protocol: parsedUrl.protocol,
    hostname: parsedUrl.hostname,
    pathname: parsedUrl.pathname,
    query: {
      ...parsedUrl.query,
      ...formatQueryParams(queryParams),
    },
  });
};

const formatRequestParams = (
  { method, url, params }: MetaApiJobRequest,
  accessToken: string,
  appSecretProof: string,
): MetaBatchRequest =>
  method === 'GET' || method === 'DELETE'
    ? {
        method,
        relative_url: formatUrlWithQuery(url, {
          ...params,
          access_token: accessToken,
          appsecret_proof: appSecretProof,
        }),
        body: undefined,
      }
    : {
        method,
        relative_url: formatUrlWithQuery(url, {
          access_token: accessToken,
          appsecret_proof: appSecretProof,
        }),
        body: params ? encodeQueryString(formatQueryParams(params)) : undefined,
      };

export default formatRequestParams;
