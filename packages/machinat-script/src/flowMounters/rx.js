// @flow
import { Observable } from 'rxjs';
import type { SessionStore } from 'machinat-session/types';
import { continueRuntime } from '../runtime';
import { SCRIPT_STATE_KEY } from '../constant';
import { makeScriptState } from '../utils';
import type { MachinatScriptType } from '../types';

const intercept = (sessionStore: SessionStore, libs: MachinatScriptType[]) => (
  observable: Object
) =>
  new Observable(observer => {
    const subscription = observable.subscribe({
      async next(frame) {
        try {
          const { channel } = frame;
          const session = sessionStore.getSession(channel);
          const originalState = await session.get(SCRIPT_STATE_KEY);

          if (!originalState) {
            observer.next(frame);
            return;
          }

          const result = continueRuntime(libs, originalState, frame);

          await frame.reply(result.content);

          if (result.finished) {
            await session.delete(SCRIPT_STATE_KEY);
          } else {
            await session.set(SCRIPT_STATE_KEY, makeScriptState(result.stack));
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

export default intercept;
