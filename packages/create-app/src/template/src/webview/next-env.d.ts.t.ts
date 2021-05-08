import { when, polishFileContent } from '../../../utils';
import { CreateAppContext } from '../../../types';

export default ({ platforms }: CreateAppContext) =>
  polishFileContent(when(platforms.includes('webview'))`
/// <reference types="next" />
/// <reference types="next/types/global" />
`);
