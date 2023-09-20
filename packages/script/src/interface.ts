/* eslint-disable import/prefer-default-export */
import { serviceInterface } from '@sociably/core/service';
import type { AnyScriptLibrary } from './types.js';

/** @category Interface */
export const LibraryAccessorI = serviceInterface<LibraryAccessorI>({
  name: 'ScriptLibraryAccessor',
});

export type LibraryAccessorI = {
  getScript: (name: string) => null | AnyScriptLibrary;
};
