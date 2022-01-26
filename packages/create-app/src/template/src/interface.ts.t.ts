import { when } from '../../utils';
import { CreateAppContext } from '../../types';

export default ({ platforms }: CreateAppContext) => when(
  platforms.includes('webview')
)`
import { makeInterface } from '@machinat/core/service';

export const ServerDomain = makeInterface<string>({ name: 'ServerDomain' });${when(
  platforms.includes('line')
)`

export const LineLiffId = makeInterface<string>({ name: 'LineLiffId' });`}
`;
