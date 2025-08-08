import type { ServiceModule } from '@sociably/core';
import StateRepositoryI from '@sociably/core/base/StateRepository.js';
import { RepositoryP } from './FileStateRepository.js';
import { ConfigsI, SerializerI } from './interface.js';

/** @category Root */
namespace FileState {
  export const Controller = RepositoryP;
  export type Controller = RepositoryP;

  export const Serializer = SerializerI;
  export type Serializer = SerializerI;

  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const initModule = (configs: ConfigsI): ServiceModule => ({
    provisions: [
      { provide: ConfigsI, withValue: configs },
      {
        provide: SerializerI,
        withValue: {
          stringify: (obj: unknown) => JSON.stringify(obj, null, 2),
          parse: JSON.parse,
        },
      },

      RepositoryP,
      { provide: StateRepositoryI, withProvider: RepositoryP },
    ],
  });
}

export default FileState;
