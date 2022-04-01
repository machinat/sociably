import type { CreateAppContext } from '../../../types';

export const binary = 'favicon.ico';
export default ({ withWebview }: CreateAppContext): boolean => withWebview;
