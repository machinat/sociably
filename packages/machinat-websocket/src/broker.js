// @flow
import EventEmitter from 'events';
import type Channel, {
  RegisterBody,
  ConnectBody,
  DisconnectBody,
} from './channel';
import type {
  WebEventJob,
  ThreadUid,
  ChannelId,
  ConnectionInfo,
  RegisterAuthenticator,
} from './types';

type ChannelStatus = {|
  instance: Channel,
  lostHeartbeatCount: number,
|};

type ConnectionStatus = {|
  connected: boolean,
  info: ConnectionInfo,
|};

// Broker
class Broker extends EventEmitter {
  _authenticator: RegisterAuthenticator;
  _channelStore: Map<ChannelId, ChannelStatus>;
  _connectionMapping: Map<ThreadUid, Map<ChannelId, ConnectionStatus>>;

  _handleChannelRegister: (body: RegisterBody, seq: number) => void;
  _handleChannelConnect: (body: ConnectBody, seq: number) => void;
  _handleChannelDisconnect: (body: DisconnectBody, seq: number) => void;
  _handleChannelConnectFail: (body: DisconnectBody, seq: number) => void;
  _handleChannelClose: (code: number, reason: string) => void;

  constructor(authenticator: RegisterAuthenticator) {
    super();
    this._authenticator = authenticator;
    this._channelStore = new Map();
    this._connectionMapping = new Map();

    const broker = this;

    function handleRegister(body: RegisterBody, seq: number) {
      broker
        ._handleChannelRegisterImpl((this: Channel), body, seq)
        .catch(this._emitError);
    }

    function handleConnect(body: ConnectBody) {
      broker
        ._handleChannelConnectImpl((this: Channel), body)
        .catch(this._emitError);
    }

    function handleDisconnect(body: DisconnectBody) {
      broker._handleDisconnectImpl((this: Channel), body);
    }

    function handleChannelClose() {
      broker._handleChannelCloseImpl((this: Channel));
    }

    this._handleChannelRegister = handleRegister;
    this._handleChannelConnect = handleConnect;

    this._handleChannelConnectFail = handleDisconnect;
    this._handleChannelDisconnect = handleDisconnect;

    this._handleChannelClose = handleChannelClose;
  }

  async addChannel(channel: Channel): Promise<boolean> {
    const channelId = channel.id;

    if (this._channelStore.has(channelId)) {
      return false;
    }

    this._channelStore.set(channelId, {
      instance: channel,
      lostHeartbeatCount: 0,
    });
    channel.on('register', this._handleChannelRegister);
    channel.on('connect', this._handleChannelConnect);
    channel.on('disconnect', this._handleChannelDisconnect);
    channel.on('close', this._handleChannelClose);

    return true;
  }

  async removeChannel(channelId: ChannelId): Promise<number> {
    const channelStatus = this._channelStore.get(channelId);

    if (channelStatus === undefined) {
      return 0;
    }

    this._channelStore.delete(channelId);

    const { instance: channel } = channelStatus;
    let unboundCount = 0;

    for (const uid of channel.connectStates.keys()) {
      const conneted = this._connectionMapping.get(uid);

      if (conneted !== undefined && conneted.delete(channelId)) {
        unboundCount += 1;
      }
    }

    return unboundCount;
  }

  async addConnection(
    uid: ThreadUid,
    channelId: ChannelId,
    info?: ConnectionInfo
  ): Promise<void> {
    const channelStatus = this._channelStore.get(channelId);
    if (channelStatus === undefined) {
      throw new Error(xxx);
    }

    const connections = this._connectionMapping.get(uid);
    if (connections !== undefined && connections.has(channelId)) {
      throw new Error(xxx);
    }

    const { instance: channel } = channelStatus;
    await channel.connect({ uid });

    this._setLocalConnection(uid, channelId, info || {}, false);
  }

  async removeConnection(uid: ThreadUid, channelId: ChannelId): Promise<void> {
    const channelStatus = this._channelStore.get(channelId);
    if (channelStatus === undefined) {
      throw new Error(xxx);
    }

    if (!this._removeLocalConnection(uid, channelId)) {
      throw new Error(xxx);
    }

    const { instance: channel } = channelStatus;
    await channel.disconnect({ uid });
  }

  getLocalConnectionInfo(
    uid: ThreadUid,
    channelId: ChannelId
  ): null | ConnectionInfo {
    const conneted = this._connectionMapping.get(uid);
    if (conneted === undefined) {
      return null;
    }

    const info = conneted.get(channelId);
    if (info === undefined) {
      return null;
    }

    return info;
  }

  async broadcast({
    body,
    whitelist,
    blacklist,
  }: WebEventJob): Promise<null | ChannelId[]> {
    const { uid } = body;
    const conneted = this._connectionMapping.get(uid);

    if (conneted === undefined) {
      return null;
    }

    const whitelistSet = whitelist && new Set(whitelist);
    const blacklistSet = blacklist && new Set(blacklist);

    const promises = [];
    const connsOnSending = [];

    for (const channelId of conneted.keys()) {
      const channelStatus = this._channelStore.get(channelId);

      if (channelStatus === undefined) {
        conneted.delete(channelId);
      } else if (
        (!whitelistSet || whitelistSet.has(channelId)) &&
        (!blacklistSet || blacklistSet.has(channelId))
      ) {
        connsOnSending.push(channelId);

        const { instance: channel } = channelStatus;
        promises.push(channel.event(body).catch(this._emitError));
      }
    }

    const results = await promises;

    const connsSent = [];
    for (let i = 0; i < results.length; i += 1) {
      if (results[i] === undefined) {
        connsSent.push(connsOnSending[i]);
      }
    }

    return connsSent;
  }

  _emitError = (err: Error) => {
    this.emit('error', err);
  };

  _setLocalConnection(
    uid: ThreadUid,
    channelId: ChannelId,
    info: ConnectionInfo,
    connected: boolean
  ) {
    let connections = this._connectionMapping.get(uid);
    if (connections === undefined) {
      connections = new Map();
      this._connectionMapping.set(uid, connections);
    }

    connections.set(channelId, { connected, info });
    return true;
  }

  _removeLocalConnection(uid: ThreadUid, channelId: ChannelId): boolean {
    const connections = this._connectionMapping.get(uid);

    if (connections === undefined) {
      return false;
    }

    if (connections.delete(channelId)) {
      if (connections.size === 0) {
        this._connectionMapping.delete(uid);
      }
      return true;
    }

    return false;
  }

  async _handleChannelRegisterImpl(
    channel: Channel,
    body: RegisterBody,
    seq: number
  ) {
    const channelStatus = this._channelStore.get(channel.id);
    if (channelStatus === undefined) {
      await channel.reject({ req: seq });
      return;
    }

    const result = this._authenticator(channel.request, body);

    if (result.accepted) {
      const { thread, info } = result;
      const uid: ThreadUid = (thread.uid: any);

      await channel.connect({ uid, req: seq });
      this._setLocalConnection(uid, channel.id, info || {}, false);
    } else {
      await channel.reject({ req: seq });
    }
  }

  async _handleChannelConnectImpl(channel: Channel, body: ConnectBody) {
    const { uid } = body;

    const channelStatus = this._channelStore.get(channel.id);
    if (channelStatus === undefined) {
      await channel.disconnect({ uid });
      return;
    }

    const connections = this._connectionMapping.get(uid);

    if (connections === undefined || !connections.has(channel.id)) {
      await channel.disconnect({ uid });
    } else {
      const status: ConnectionStatus = (connections.get(channel.id): any);
      this._setLocalConnection(uid, channel.id, status.info, true);
    }
  }

  _handleDisconnectImpl(channel: Channel, body: DisconnectBody) {
    const { uid } = body;
    this._removeLocalConnection(uid, channel.id);
  }

  _handleChannelCloseImpl(channel: Channel) {
    this.removeChannel(channel.id);
  }
}

export default Broker;
