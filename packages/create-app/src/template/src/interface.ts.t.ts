import { when } from '../../utils';
import { CreateAppContext } from '../../types';

export default ({ platforms }: CreateAppContext): string => when(
  platforms.includes('webview')
)`
import { makeInterface } from '@machinat/core';

export const ServerDomain = makeInterface<string>({ name: 'ServerDomain' });${when(
  platforms.includes('line')
)`

export const LineLiffId = makeInterface<string>({ name: 'LineLiffId' });`}
`;
