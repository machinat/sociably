import { useState, useEffect } from 'react';
import WebviewClient from './Client.js';
import type { EventValue, AnyClientAuthenticator } from '../types.js';
import type { ClientOptions } from './types.js';

function useClient<
  Authenticator extends AnyClientAuthenticator,
  Value extends EventValue = EventValue,
>(options: ClientOptions<Authenticator>): WebviewClient<Authenticator, Value> {
  const [client, setClient] = useState<WebviewClient<Authenticator, Value>>(
    () => new WebviewClient<Authenticator, Value>(options),
  );
  const [isInitial, setIsInitial] = useState(true);

  useEffect(() => {
    if (isInitial) {
      setIsInitial(false);
      return () => client.close();
    }

    // refresh the client while hot reloading in dev mode.
    const newClient = new WebviewClient<Authenticator, Value>(options);
    setClient(newClient);
    return () => newClient.close();
  }, []);

  return client;
}

export default useClient;
