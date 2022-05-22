import type { MachinatUser } from '@machinat/core';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import UserProfile from './UserProfile';
import { TWITTER } from './constant';
import type { RawUser } from './types';

type SerializedUser = {
  id: string;
};

export default class TwitterUser
  implements MachinatUser, MarshallableInstance<SerializedUser>
{
  static typeName = 'TwitterUser';
  static fromJSONValue({ id }: SerializedUser): TwitterUser {
    return new TwitterUser(id);
  }

  platform = TWITTER;
  id: string;
  data: null | RawUser;

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
