import type { MachinatChannel } from '@machinat/core';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import { TELEGRAM } from './constant';

type TelegramChatTargetValue = {
  botId: number;
  id: string | number;
};

class TelegramChatTarget
  implements MachinatChannel, MarshallableInstance<TelegramChatTargetValue>
{
  static typeName = 'TelegramChatTarget';

  static fromJSONValue(value: TelegramChatTargetValue): TelegramChatTarget {
    return new TelegramChatTarget(value.botId, value.id);
  }

  botId: number;
  id: string | number;

  platform = TELEGRAM;
  type = 'unknown' as const;

  constructor(botId: number, id: number | string) {
    this.botId = botId;
    this.id = id;
  }

  get uid(): string {
    return `telegram.${this.botId}.${this.id}`;
  }

  toJSONValue(): TelegramChatTargetValue {
    const { botId, id } = this;
    return { botId, id };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return TelegramChatTarget.typeName;
  }
}

export default TelegramChatTarget;
