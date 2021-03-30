import { makeInterface } from '../service';
import type { ModuleUtilities } from '../types';

const ModuleUtilitiesI = makeInterface<ModuleUtilities>({
  name: 'ModuleUtilities',
});

export default ModuleUtilitiesI;
