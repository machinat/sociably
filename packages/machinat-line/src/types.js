// @flow

type UserSource = {|
  type: 'user',
  userId: string,
|};

type GroupSource = {|
  type: 'group',
  userId: string,
  groupId: string,
|};

type RoomSource = {|
  type: 'room',
  userId: string,
  roomId: string,
|};

export type LineSource = UserSource | GroupSource | RoomSource;
