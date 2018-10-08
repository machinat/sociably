export default class LineUserProfile {
  constructor(raw) {
    this.raw = raw;
  }

  get id() {
    return this.raw.userId;
  }

  get name() {
    return this.raw.displayName;
  }

  get pictureURL() {
    return this.raw.pictureUrl;
  }
}
