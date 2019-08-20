// @flow
import type { SessionStore } from 'machinat-session/types';
import { Observable } from 'rxjs';
import type { MachinatScript } from '../types';
import processor from '../processor';

const processScript = (sessionStore: SessionStore, libs: MachinatScript[]) => {
  const processEvent = processor(sessionStore, libs);

  return (observable: Object) =>
    new Observable(observer => {
      const subscription = observable.subscribe({
        async next(frame) {
          try {
            const nextFrame = processEvent(frame);
            if (nextFrame) {
              observer.next(nextFrame);
            }
          } catch (err) {
            observer.error(err);
          }
        },
        error(err) {
          observer.error(err);
        },
        complete() {
          observer.complete();
        },
      });

      return () => {
        subscription.unsubscribe();
      };
    });
};

export default processScript;
