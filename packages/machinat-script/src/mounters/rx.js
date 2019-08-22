// @flow
import type { SessionStore } from 'machinat-session/types';
import { pipe } from 'rxjs';
import { groupBy, concatMap, mergeMap, filter } from 'rxjs/operators';
import type { MachinatScript } from '../types';
import processor from '../processor';

const isNotEmpty = frame => !!frame;

const processScript = (sessionStore: SessionStore, libs: MachinatScript[]) => {
  const processEvent = processor(sessionStore, libs);
  const processEventCatched = async frame => {
    try {
      const nextFrame = await processEvent(frame);
      return nextFrame;
    } catch (err) {
      // TODO: what to do here?
      return { ...frame, scriptError: err };
    }
  };

  return pipe(
    groupBy(frame => frame.channel.uid),
    mergeMap(channel$ => channel$.pipe(concatMap(processEventCatched))),
    filter(isNotEmpty)
  );
};

export default processScript;
