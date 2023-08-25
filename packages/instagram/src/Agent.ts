import type { UniqueOmniIdentifier } from '@sociably/core';
import type { MetaApiChannel } from '@sociably/meta-api';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { INSTAGRAM, IG } from './constant.js';

type InstagramAgentValue = {
  id: string;
};

class InstagramAgent
  implements MetaApiChannel, MarshallableInstance<InstagramAgentValue>
{
  static typeName = 'IgAgent';
  static fromJSONValue({ id }: InstagramAgentValue): InstagramAgent {
    return new InstagramAgent(id);
  }

  id: string;
  username?: string;
  readonly platform = INSTAGRAM;
  readonly $$typeofChannel = true;

  constructor(id: string, username?: string) {
    this.id = id;
    this.username = username;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: INSTAGRAM,
      id: this.id,
    };
  }

  get uid(): string {
    return `${IG}.${this.id}`;
  }

  toJSONValue(): InstagramAgentValue {
    return { id: this.id };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return InstagramAgent.typeName;
  }
}

export default InstagramAgent;
