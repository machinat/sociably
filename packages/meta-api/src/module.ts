import type { ServiceModule } from '@sociably/core';
import { serviceProviderFactory } from '@sociably/core/service';
import Http from '@sociably/http';
import type { RequestRoute } from '@sociably/http';
import { MetaApiModuleConfigs } from './types.js';
import { ConfigsI } from './interface.js';
import ReceiverP from './Receiver.js';

/** @interanl */
const webhookRouteFactory = serviceProviderFactory({
  lifetime: 'transient',
  deps: [ConfigsI, ReceiverP],
})(
  (configs, receiver): RequestRoute => ({
    name: 'meta-api',
    path: configs.webhookPath || '.',
    handler: receiver.handleRequestCallback(),
  })
);

/**
 * @category Root
 */
namespace MetaApi {
  export const Receiver = ReceiverP;
  export type Receiver = ReceiverP;

  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const initModule = (configs: MetaApiModuleConfigs): ServiceModule => {
    return {
      provisions: [
        ReceiverP,
        { provide: Http.RequestRouteList, withProvider: webhookRouteFactory },
        { provide: ConfigsI, withValue: configs },
      ],
    };
  };
}

export default MetaApi;
