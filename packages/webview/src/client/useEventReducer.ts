import { useReducer, useEffect } from 'react';
import type WebviewClient from './client';
import type { EventValue, AnyClientAuthenticator } from '../types';
import type { ClientEventContext, EventContextOfClient } from './types';

function useEventReducer<
  T,
  Client extends WebviewClient<
    EventValue,
    AnyClientAuthenticator
  > = WebviewClient<EventValue, AnyClientAuthenticator>
>(
  client: Client,
  reducer: (value: T, context: EventContextOfClient<Client>) => T,
  initialValue: T
): T;

function useEventReducer<T>(
  client: WebviewClient<EventValue, AnyClientAuthenticator>,
  reducer: (
    value: T,
    context: ClientEventContext<AnyClientAuthenticator, EventValue>
  ) => T,
  initialValue: T
): T {
  const [data, dispatchEvent] = useReducer(reducer, initialValue);

  useEffect(() => {
    const eventListener = (
      context: ClientEventContext<AnyClientAuthenticator, EventValue>
    ) => {
      dispatchEvent(context);
    };

    client.onEvent(eventListener);
    return () => {
      client.removeEventListener(eventListener);
    };
  }, [client]);

  return data;
}

export default useEventReducer;
