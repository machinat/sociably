import { when } from '../../utils.js';
import { CreateAppContext } from '../../types.js';

export const name = '.gitignore';

export default ({ withWebview }: CreateAppContext): string => when(withWebview)`
# typescript
*.tsbuildinfo
next-env.d.ts.t
`;
