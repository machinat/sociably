import Profile from './userProfile';

export default class LineContext {
  constructor(event, connector) {
    this.event = event;
    this._connector = connector;
  }

  async getUserProfile() {
    const { userId } = this.event;
    if (userId === undefined) {
      return undefined;
    }
    const rawProfile = await this._connector.client.get(
      `profile/${this.event.userId}`
    );
    return new Profile(rawProfile);
  }

  reply(nodes, options) {
    return this._connector.send(this.event.thread, nodes, options);
  }
}
