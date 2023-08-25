import type {
  SociablyUser,
  SociablyChannel,
  UniqueOmniIdentifier,
} from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import UserProfile from './UserProfile.js';
import { TWITTER, TWTR } from './constant.js';
import type { RawUser } from './types.js';

type SerializedUser = {
  id: string;
};

export default class TwitterUser
  implements
    SociablyUser,
    SociablyChannel,
    MarshallableInstance<SerializedUser>
{
  static typeName = 'TwtrUser';
  static fromJSONValue({ id }: SerializedUser): TwitterUser {
    return new TwitterUser(id);
  }

  id: string;
  data: null | RawUser;

  readonly platform = TWITTER;
  readonly $$typeofChannel = true;
  readonly $$typeofUser = true;

  constructor(id: string, rawData?: RawUser) {
    this.id = id;
    this.data = rawData || null;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: TWITTER,
      id: this.id,
    };
  }

  get uid(): string {
    return `${TWTR}.${this.id}`;
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
