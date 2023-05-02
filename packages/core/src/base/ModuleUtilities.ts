import { serviceInterface } from '../service';
import type { ModuleUtilities } from '../types';

const ModuleUtilitiesI = serviceInterface<ModuleUtilities>({
  name: 'ModuleUtilities',
});

export default ModuleUtilitiesI;
