/// <reference lib="DOM" />
import { AnyMarshalType, BaseMarshaler } from '@machinat/core/base/Marshaler';
import AuthClient from '@machinat/auth/client';
import type {
  UserOfAuthenticator,
  ContextOfAuthenticator,
} from '@machinat/auth';
import { Connector, ClientEmitter } from '@machinat/websocket/client';
import { DEFAULT_AUTH_PATH, DEFAULT_WEBSOCKET_PATH } from '../constant';
import { WebviewConnection } from '../channel';
import { createEvent } from '../utils';
import type {
  EventInput,
  EventValue,
  ConnectEventValue,
  DisconnectEventValue,
  AnyClientAuthenticator,
} from '../types';
import type { ClientEventContext, ClientOptions } from './types';

class WebviewClient<
  Value extends EventValue = EventValue,
  Authenticator extends AnyClientAuthenticator = AnyClientAuthenticator
> extends ClientEmitter<
  ClientEventContext<
    Authenticator,
    Value | ConnectEventValue | DisconnectEventValue
  >
> {
  private _authClient: AuthClient<Authenticator>;
  private _connector: Connector<UserOfAuthenticator<Authenticator>>;
  private _platformInput: string | undefined;

  private _user: null | UserOfAuthenticator<Authenticator>;
  private _channel: null | WebviewConnection;

  isMockupMode: boolean;

  get isConnected(): boolean {
    return this._connector.isConnected();
  }

  get user(): null | UserOfAuthenticator<Authenticator> {
    return this._user;
  }

  get channel(): null | WebviewConnection {
    return this._channel;
  }

  get authContext(): null | ContextOfAuthenticator<Authenticator> {
    return this._authClient.getAuthContext();
  }

  get platform(): string | undefined {
    return this._authClient.platform;
  }

  constructor({
    webSocketUrl,
    platform,
    authPlatforms,
    authApiUrl,
    mockupMode = false,
  }: ClientOptions<Authenticator>) {
    super();

    this._user = null;
    this._channel = null;
    this.isMockupMode = mockupMode;
    this._platformInput = platform;

    this._authClient = new AuthClient({
      authenticators: authPlatforms,
      serverUrl: authApiUrl || DEFAULT_AUTH_PATH,
    });

    const marshalTypes = authPlatforms.reduce((types, authenticator) => {
      if (authenticator.marshalTypes) {
        types.push(...authenticator.marshalTypes);
      }
      return types;
    }, [] as AnyMarshalType[]);

    this._connector = new Connector<UserOfAuthenticator<Authenticator>>(
      webSocketUrl || DEFAULT_WEBSOCKET_PATH,
      this._getLoginAuth.bind(this),
      new BaseMarshaler(marshalTypes)
    )
      .on('connect', this._handleConnect.bind(this))
      .on('events', this._handleEvent.bind(this))
      .on('disconnect', this._handleDisconnect.bind(this))
      .on('error', this._emitError.bind(this));

    if (!this.isMockupMode) {
      this._connector.start().catch(this._emitError.bind(this));
    }
  }

  async send(content: EventInput | EventInput[]): Promise<void> {
    await this._connector.send(Array.isArray(content) ? content : [content]);
  }

  disconnect(reason: string): void {
    this._connector.disconnect(reason);
  }

  /**
   * Try close the webview. Return whether it's supported by current platform
   */
  closeWebview(): boolean {
    const authenticator = this._authClient.getAuthenticator();
    if (!authenticator) {
      return false;
    }

    return authenticator.closeWebview();
  }

  private async _getLoginAuth(): Promise<{
    user: UserOfAuthenticator<Authenticator>;
    credential: string;
  }> {
    const { token, context } = await this._authClient.signIn({
      platform: this._platformInput,
    });
    return {
      user: context.user as UserOfAuthenticator<Authenticator>,
      credential: token,
    };
  }

  private _handleConnect({
    connId,
    user,
  }: {
    connId: string;
    user: UserOfAuthenticator<Authenticator>;
  }) {
    this._user = user;
    this._channel = new WebviewConnection('*', connId);

    this._emitEvent({
      event: createEvent(
        {
          category: 'connection',
          type: 'connect',
          payload: null,
        },
        this._channel,
        user
      ),
      auth: this.authContext as ContextOfAuthenticator<Authenticator>,
      authenticator: this._authClient.getAuthenticator() as Authenticator,
    });
  }

  private _handleEvent(values: Value[]) {
    for (const value of values) {
      this._emitEvent({
        event: createEvent(
          value,
          this._channel as WebviewConnection,
          this._user as UserOfAuthenticator<Authenticator>
        ),
        auth: this.authContext as ContextOfAuthenticator<Authenticator>,
        authenticator: this._authClient.getAuthenticator() as Authenticator,
      });
    }
  }

  private _handleDisconnect({ reason }: { reason: string }) {
    const channel = this._channel;
    this._channel = null;

    this._emitEvent({
      event: createEvent(
        {
          category: 'connection',
          type: 'disconnect',
          payload: { reason },
        },
        channel as WebviewConnection,
        this._user as UserOfAuthenticator<Authenticator>
      ),
      auth: this.authContext as ContextOfAuthenticator<Authenticator>,
      authenticator: this._authClient.getAuthenticator() as Authenticator,
    });
  }
}

export default WebviewClient;
