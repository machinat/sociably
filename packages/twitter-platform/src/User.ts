import type { SociablyUser, SociablyAgent } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler.js';
import UserProfile from './UserProfile.js';
import { TWITTER } from './constant.js';
import type { RawUser } from './types.js';

type SerializedUser = {
  id: string;
};

export default class TwitterUser
  implements SociablyUser, SociablyAgent, MarshallableInstance<SerializedUser>
{
  static typeName = 'TwitterUser';
  static fromJSONValue({ id }: SerializedUser): TwitterUser {
    return new TwitterUser(id);
  }

  id: string;
  data: null | RawUser;

  readonly platform = TWITTER;
  readonly $$typeofAgent = true;
  readonly $$typeofUser = true;

  constructor(id: string, rawData?: RawUser) {
    this.id = id;
    this.data = rawData || null;
  }

  get uid(): string {
    return `${TWITTER}.${this.id}`;
  }

  get profile(): null | UserProfile {
    return this.data ? new UserProfile(this.data) : null;
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return TwitterUser.typeName;
  }

  toJSONValue(): SerializedUser {
    return { id: this.id };
  }
}
