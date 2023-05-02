import { SociablyApp } from '@sociably/core';
import { serviceContainer, ServiceScope } from '@sociably/core/service';
import Stream from './stream';
import { EventContextOfApp } from './types';

const fromApp = <App extends SociablyApp<any>>(
  app: App
): Stream<EventContextOfApp<App>> => {
  const subject = new Stream<EventContextOfApp<App>>();

  app.onEvent(
    serviceContainer({ deps: [ServiceScope] })(
      (scope: ServiceScope) => (context: EventContextOfApp<App>) => {
        subject.next({
          scope,
          value: context,
          key: context.event.thread?.uid,
        });
      }
    )
  );

  app.onError(
    serviceContainer({ deps: [ServiceScope] })(
      (scope: ServiceScope) => (error: Error) => {
        subject.error({
          scope,
          value: error,
          key: undefined,
        });
      }
    )
  );

  return subject;
};

export default fromApp;
