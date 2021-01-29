/* eslint-disable import/prefer-default-export */
import { makeInterface } from '@machinat/core/service';
import type { AnyScriptLibrary } from './types';

/**
 * @category Interface
 */
export const LibraryList = makeInterface<AnyScriptLibrary>({
  name: 'ScriptLibraryList',
  multi: true,
});

export type LibraryList = AnyScriptLibrary;
