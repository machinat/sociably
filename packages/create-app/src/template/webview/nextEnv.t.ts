import { when } from '../../utils.js';
import { CreateAppContext } from '../../types.js';

export const name = 'next-env.d.ts';

export default ({ withWebview }: CreateAppContext): string => when(withWebview)`
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
`;
