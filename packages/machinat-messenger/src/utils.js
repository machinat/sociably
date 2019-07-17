// @flow
import deepEqual from 'fast-deep-equal';
import {
  asNative,
  asNamespace,
  wrapSinglePartSegment,
  wrapSingleUnitSegment,
} from 'machinat-renderer';
import { compose, joinTextualSegments } from 'machinat-utility';
import type { MachinatElement } from 'machinat/types';
import type { RenderInnerFn } from 'machinat-renderer/types';

import type { MessengerRequest, MessengerSegmentValue } from './types';
import {
  MESSENGER_NATIVE_TYPE,
  MESSENGER_NAMESPACE,
  ENTRY_PATH,
} from './constant';

export const appendField = (body: string, key: string, value: string) =>
  `${body.length === 0 ? body : `${body}&`}${key}=${encodeURIComponent(value)}`;

export const encodeURIBody = (fields: { [string]: any }): string => {
  let body = '';

  for (const key of Object.keys(fields)) {
    const fieldValue = fields[key];

    if (fieldValue !== undefined) {
      body = appendField(
        body,
        key,
        typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue)
      );
    }
  }

  return body;
};

export const formatRequest = (request: MessengerRequest) => ({
  ...request,
  body: encodeURIBody(request.body),
});

const { hasOwnProperty } = Object.prototype;
export const isMessageValue = (value: string | MessengerSegmentValue) =>
  typeof value === 'string' || !hasOwnProperty.call(value, ENTRY_PATH);

export const asContainerComponent = compose<any>(
  asNative(MESSENGER_NATIVE_TYPE),
  asNamespace(MESSENGER_NAMESPACE)
);

export const asPartComponent = compose<any>(
  asNative(MESSENGER_NATIVE_TYPE),
  asNamespace(MESSENGER_NAMESPACE),
  wrapSinglePartSegment
);

export const asUnitComponent = compose<any>(
  asNative(MESSENGER_NATIVE_TYPE),
  asNamespace(MESSENGER_NAMESPACE),
  wrapSingleUnitSegment
);

export const mapJoinedTextValues = (mapper: string => string) => async (
  node: MachinatElement<string>,
  render: RenderInnerFn<any, any>,
  path: string
) => {
  const segments = await render((node.props.children: any), '.children');

  const joined = joinTextualSegments(segments, node, path);
  if (joined === null) {
    return null;
  }

  for (const segment of joined) {
    if (segment.type === 'text') {
      segment.value = mapper(segment.value);
    }
  }

  return joined;
};

const equal = (a, b) => a === b;
const equalArraySorted = (expected: any[], actual: any[]) =>
  deepEqual(expected.sort(), actual.sort());

const compareLocale = (a, b) =>
  a.locale < b.locale ? -1 : a.locale > b.locale ? 1 : 0;

const equalArraySortedByLocale = (expected: Object[], actual: Object[]) =>
  deepEqual(expected.sort(compareLocale), actual.sort(compareLocale));

const equalTargetAudience = (a: Object, b: Object) => {
  if (a.audience_type !== b.audience_type || !a.countries !== !b.countries) {
    return false;
  }

  if (!a.countries && !b.countries) {
    return true;
  }

  if (
    !a.countries.whitelist !== !b.countries.whitelist ||
    !a.countries.blacklist !== !b.countries.blacklist
  ) {
    return false;
  }

  return (
    ((!a.countries.whitelist && !b.countries.whitelist) ||
      equalArraySorted(a.countries.whitelist, b.countries.whitelist)) &&
    ((!a.countries.blacklist && !b.countries.blacklist) ||
      equalArraySorted(a.countries.blacklist, b.countries.blacklist))
  );
};

export const diffProfile = (expected: Object, actual: Object) => {
  const updates = {};
  const deletes = [];

  const checkProp = (
    prop: string,
    test: (expectedProp: any, actualProp: any) => boolean
  ) => {
    if (expected[prop]) {
      if (!actual[prop] || !test(expected[prop], actual[prop])) {
        updates[prop] = expected[prop];
      }
    } else if (actual[prop]) {
      deletes.push(prop);
    }
  };

  checkProp('account_linking_url', equal);
  checkProp('persistent_menu', equalArraySortedByLocale);
  checkProp('get_started', deepEqual);
  checkProp('greeting', equalArraySortedByLocale);
  checkProp('whitelisted_domains', equalArraySorted);
  checkProp('target_audience', equalTargetAudience);
  checkProp('home_url', deepEqual);

  return { updates, deletes };
};
