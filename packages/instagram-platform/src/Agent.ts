import type { MetaApiAgent } from '@sociably/meta-api';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler.js';
import { INSTAGRAM } from './constant.js';

type InstagramAgentValue = {
  id: string;
};

class InstagramAgent
  implements MetaApiAgent, MarshallableInstance<InstagramAgentValue>
{
  static typeName = 'InstagramAgent';
  static fromJSONValue({ id }: InstagramAgentValue): InstagramAgent {
    return new InstagramAgent(id);
  }

  id: string;
  username?: string;
  readonly platform = INSTAGRAM;
  readonly $$typeofAgent = true;

  constructor(id: string, username?: string) {
    this.id = id;
    this.username = username;
  }

  get uid(): string {
    return `${INSTAGRAM}.${this.id}`;
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
