/* eslint-disable import/prefer-default-export */
import { serviceInterface } from '@sociably/core/service';
import type { AnyScriptLibrary } from './types';

/**
 * @category Interface
 */
export const LibraryListI = serviceInterface<AnyScriptLibrary>({
  name: 'ScriptLibraryList',
  multi: true,
});

export type LibraryListI = AnyScriptLibrary;
