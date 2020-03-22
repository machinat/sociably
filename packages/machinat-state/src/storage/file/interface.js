// @flow
/* eslint-disable import/prefer-default-export */
import { namedInterface } from '@machinat/core/service';
import type { FileRepositoryConfigs } from './types';

export const FILE_STORAGE_CONFIGS_I = namedInterface<FileRepositoryConfigs>(
  'FileStorageConfigs'
);
