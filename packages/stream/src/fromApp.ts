import { makeContainer, ServiceScope } from '@machinat/core/service';
import { MachinatApp } from '@machinat/core/types';
import Subject from './subject';
import { EventContextOfApp } from './types';

const fromApp = <App extends MachinatApp<any>>(
  app: App
): Subject<EventContextOfApp<App>> => {
  const subject = new Subject<EventContextOfApp<App>>();

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
