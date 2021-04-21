import { MachinatApp } from '@machinat/core';
import { makeContainer, ServiceScope } from '@machinat/core/service';
import Stream from './stream';
import { EventContextOfApp } from './types';

const fromApp = <App extends MachinatApp<any>>(
  app: App
): Stream<EventContextOfApp<App>> => {
  const subject = new Stream<EventContextOfApp<App>>();

  app.onEvent(
    makeContainer({ deps: [ServiceScope] })(
      (scope: ServiceScope) => (context: EventContextOfApp<App>) => {
        subject.next({
          scope,
          value: context,
          key: context.event.channel?.uid,
        });
      }
    )
  );

  app.onError(
    makeContainer({ deps: [ServiceScope] })(
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
