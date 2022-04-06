import { useState, useEffect } from 'react';
import WebviewClient from './client';
import type { EventValue, AnyClientAuthenticator } from '../types';
import type { ClientOptions } from './types';

function useClient<
  Value extends EventValue,
  Authenticator extends AnyClientAuthenticator
>(options: ClientOptions<Authenticator>): WebviewClient<Value, Authenticator> {
  const [client] = useState(() => new WebviewClient(options));

  useEffect(() => {
    return () => client.close();
  }, [client]);

  return client;
}

export default useClient;
