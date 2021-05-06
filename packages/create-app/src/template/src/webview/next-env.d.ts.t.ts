import { when, polishFileContent } from '../../../templateHelper';
import { CreateAppContext } from '../../../types';

export default ({ platforms }: CreateAppContext) =>
  polishFileContent(when(platforms.includes('webview'))`
/// <reference types="next" />
/// <reference types="next/types/global" />
`);
