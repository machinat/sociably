// @flow
import EventEmitter from 'events';
import { mixin } from 'machinat-utility';
import type { MachinatBot, BotPlugin } from 'machinat-base/types';

type MultiplexerOptions = {
  plugins?: BotPlugin<any, any, any, any, any, any, any, any>[],
};

class MachinatMultiplexer<
  Bot: MachinatBot<any, any, any, any, any, any, any, any>
> extends EventEmitter {
  plugins: void | BotPlugin<any, any, any, any, any, any, any, any>[];
  _botMapping: Map<string, Bot>;

  constructor(options?: MultiplexerOptions) {
    super();

    this.plugins = options && options.plugins;
    this._botMapping = new Map();
  }

  wrap(id: string, bot: Bot) {
    // bind new handler to adator
    const eventHandler = bot.controller.makeEventHandler(
      bot,
      frame => {
        bot.emit('event', frame);
        this.emit('event', frame);
        return Promise.resolve();
      },
      err => {
        this.emit('error', err, bot);
      }
    );

    bot.adaptor.bind(eventHandler);

    // extends common middlewares and extensions from plugins
    const getBotMixin = Object.defineProperty({}, 'getBot', {
      value: this.getBot.bind(this),
    });

    if (this.plugins) {
      const commonReceiveMws = [];
      const commonDispatchMws = [];
      const commonReceiveExts = [];
      const commonDispatchExts = [];

      for (const plugin of this.plugins) {
        const {
          dispatchMiddleware,
          dispatchFrameExtension,
          receiveMiddleware,
          receiveFrameExtension,
        } = plugin(bot);

        if (receiveMiddleware) commonReceiveMws.push(receiveMiddleware);
        if (dispatchMiddleware) commonDispatchMws.push(dispatchMiddleware);

        if (receiveFrameExtension)
          commonReceiveExts.push(receiveFrameExtension);
        if (dispatchFrameExtension)
          commonDispatchExts.push(dispatchFrameExtension);
      }

      bot.controller.setMiddlewares(
        ...commonReceiveMws,
        ...bot.controller.middlewares
      );
      bot.controller.setFramePrototype(
        mixin(getBotMixin, ...commonReceiveExts, bot.controller.frame)
      );

      bot.engine.setMiddlewares(
        ...commonDispatchMws,
        ...bot.engine.middlewares
      );
      bot.engine.setFramePrototype(
        mixin(getBotMixin, ...commonDispatchExts, bot.engine.frame)
      );
    } else {
      bot.controller.setFramePrototype(
        mixin(getBotMixin, bot.controller.frame)
      );
      bot.engine.setFramePrototype(mixin(getBotMixin, bot.engine.frame));
    }

    this._botMapping.set(id, bot);
    return bot;
  }

  getBot(id: string) {
    return this._botMapping.get(id);
  }
}

export default MachinatMultiplexer;
