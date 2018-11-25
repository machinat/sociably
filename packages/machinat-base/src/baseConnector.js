// @flow
import EventEmitter from 'events';
import compose from 'koa-compose';

import type { MachinatContext } from './types';

type MiddlewareFunc = (MachinatContext<any>, () => Promise<void>) => void;

class BaseConnector<Ctx: MachinatContext<any>> extends EventEmitter {
  middlewares: Array<MiddlewareFunc>;

  constructor() {
    super();
    this.middlewares = [];
  }

  use(fn: MiddlewareFunc) {
    if (typeof fn !== 'function')
      throw new TypeError('middleware must be a function!');

    this.middlewares.push(fn);
    return this;
  }

  createMiddlewaresFn(): Ctx => Promise<void> {
    return compose(this.middlewares);
  }

  handleEvents(contexts: Array<Ctx>, fn: Ctx => Promise<void>) {
    const midddlewarePromises = new Array(contexts.length);

    for (let i = 0; i < contexts.length; i += 1) {
      const context = contexts[i];
      this.emit('event', context.event);

      midddlewarePromises[i] = fn(context);
    }

    return Promise.all(midddlewarePromises);
  }
}

export default BaseConnector;
