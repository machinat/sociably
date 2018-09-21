import Profile from './userProfile';

const BASIC_PROFILE_FIELDS = 'id,name,first_name,last_name,profile_pic';

export default class Context {
  constructor(event, connector, respond) {
    this.event = event;
    this._connector = connector;
    this._respond = respond;
  }

  async getUserProfile() {
    const { userId } = this.event;
    if (userId === undefined) {
      return undefined;
    }
    const rawProfile = await this._connector.client.get(this.event.userId, {
      fields: BASIC_PROFILE_FIELDS,
    });
    return new Profile(rawProfile);
  }

  reply(nodes, options) {
    return this._connector.send(this.event.thread, nodes, options);
  }
}
