import { when, polishFileContent } from '../../templateHelper';
import { CreateAppContext } from '../../types';

export default ({ platforms }: CreateAppContext) =>
  polishFileContent(when(platforms.includes('webview'))`
import { makeInterface } from '@machinat/core/service';

export const ServerDomain = makeInterface<string>({ name: 'ServerDomain' });${when(
    platforms.includes('line')
  )`

export const LineLiffId = makeInterface<string>({ name: 'LineLiffId' });`}
`);
