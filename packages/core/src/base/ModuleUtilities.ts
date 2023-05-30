import { serviceInterface } from '../service/index.js';
import type { ModuleUtilities } from '../types.js';

const ModuleUtilitiesI = serviceInterface<ModuleUtilities>({
  name: 'ModuleUtilities',
});

export default ModuleUtilitiesI;
