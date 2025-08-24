import { MessengerUser } from '@sociably/messenger';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler.js';
import InstagramAgent from './Agent.js';
import { INSTAGRAM } from './constant.js';

type InstagramUserValue = {
  agent: string;
  id: string;
};

export default class InstagramUser
  implements MessengerUser, MarshallableInstance<InstagramUserValue>
{
  static typeName = 'InstagramUser';

  static fromJSONValue(value: InstagramUserValue): InstagramUser {
    const { agent, id } = value;
    return new InstagramUser(agent, id);
  }

  readonly platform = INSTAGRAM;
  readonly $$typeofUser = true;
  agentId: string;
  id: string;

  constructor(agentId: string, id: string) {
    this.agentId = agentId;
    this.id = id;
  }

  get uid(): string {
    return `${INSTAGRAM}.${this.agentId}.${this.id}`;
  }

  get agent(): InstagramAgent {
    return new InstagramAgent(this.agentId);
  }

  toJSONValue(): InstagramUserValue {
    const { agentId, id } = this;
    return { agent: agentId, id };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return InstagramUser.typeName;
  }
}
