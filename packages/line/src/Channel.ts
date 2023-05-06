import type { SociablyChannel, UniqueOmniIdentifier } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { LINE } from './constant';

type LineChannelValue = {
  id: string;
};

class LineChannel
  implements SociablyChannel, MarshallableInstance<LineChannelValue>
{
  static typeName = 'LineChannel';
  static fromJSONValue(value: LineChannelValue): LineChannel {
    const { id } = value;
    return new LineChannel(id);
  }

  id: string;
  readonly platform = LINE;
  readonly $$typeofChannel = true;

  constructor(id: string) {
    this.id = id;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      $$typeof: ['channel'],
      platform: LINE,
      id: this.id,
    };
  }

  get uid(): string {
    return `${LINE}.${this.id}`;
  }

  toJSONValue(): LineChannelValue {
    return { id: this.id };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return LineChannel.typeName;
  }
}

export default LineChannel;
