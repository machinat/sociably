import type { CreateAppContext } from '../../../types.js';

export const binary = 'favicon.ico';
export default ({ withWebview }: CreateAppContext): boolean => withWebview;
