export default class MessengerProfile {
  constructor(rawProfile) {
    this.raw = rawProfile;
  }

  get id() {
    return this.raw.id;
  }

  get name() {
    return this.raw.name;
  }

  get pictureURL() {
    return this.raw.profile_pic;
  }
}
