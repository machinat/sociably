import { useState, useEffect } from 'react';
import WebviewClient from './client';
import type { EventValue, AnyClientAuthenticator } from '../types';
import type { ClientOptions } from './types';

function useClient<
  Authenticator extends AnyClientAuthenticator,
  Value extends EventValue = EventValue
>(options: ClientOptions<Authenticator>): WebviewClient<Authenticator, Value> {
  const [client, setClient] = useState(
    // HACK: use a mock client as the initial value. The real client is created
    //       later in useEffect. This forces the client to be refreshed while
    //       hot reloading in dev mode.
    () => new WebviewClient({ ...options, mockupMode: true })
  );

  useEffect(() => {
    const newClient = new WebviewClient(options);
    setClient(newClient);

    return () => newClient.close();
  }, []);

  return client;
}

export default useClient;
