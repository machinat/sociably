// @flow
import type { IncomingMessage } from 'http';
import type { HTTPRequestReceivable, HTTPUpgradeReceivable } from './types';

class Router<Bot: HTTPRequestReceivable<any> | HTTPUpgradeReceivable<any>> {
  routings: { matcher: IncomingMessage => boolean, bot: Bot }[];
  defaultBot: void | Bot;

  constructor() {
    this.routings = [];
  }

  default(bot: Bot) {
    this.defaultBot = bot;
  }

  route(matcher: IncomingMessage => boolean, bot: Bot) {
    this.routings.push({ matcher, bot });
    return this;
  }

  provide() {
    const routings = [...this.routings];
    const { defaultBot } = this;

    return (req: IncomingMessage) => {
      for (let i = 0; i < routings.length; i += 1) {
        const { matcher, bot } = routings[i];

        if (matcher(req)) {
          return bot;
        }
      }

      return defaultBot;
    };
  }
}

export default Router;
