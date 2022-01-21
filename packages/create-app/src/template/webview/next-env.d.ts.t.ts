import { when, polishFileContent } from '../../utils';
import { CreateAppContext } from '../../types';

export default ({ platforms }: CreateAppContext) =>
  polishFileContent(when(platforms.includes('webview'))`
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
`);
