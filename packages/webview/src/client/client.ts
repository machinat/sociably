// eslint-disable-next-line spaced-comment
/// <reference lib="DOM" />
import { AnyMarshalType, BaseMarshaler } from '@machinat/core/base/Marshaler';
import AuthClient from '@machinat/auth/client';
import type { UserOfAuthorizer, ContextOfAuthorizer } from '@machinat/auth';
import { Connector, ClientEmitter } from '@machinat/websocket/client';
import { DEFAULT_AUTH_PATH, DEFAULT_WEBSOCKET_PATH } from '../constant';
import { WebviewConnection } from '../channel';
import { createEvent } from '../utils';
import type {
  EventInput,
  EventValue,
  ConnectEventValue,
  DisconnectEventValue,
  AnyClientAuthorizer,
} from '../types';
import type { ClientEventContext, ClientOptions } from './types';

class WebviewClient<
  Authorizer extends AnyClientAuthorizer,
  Value extends EventValue = EventValue
> extends ClientEmitter<ClientEventContext<Authorizer, Value>> {
  private _authClient: AuthClient<Authorizer>;
  private _connector: Connector<UserOfAuthorizer<Authorizer>>;
  private _platformInput: string | undefined;

  private _user: null | UserOfAuthorizer<Authorizer>;
  private _channel: null | WebviewConnection;

  isMockupMode: boolean;

  get isConnected(): boolean {
    return this._connector.isConnected();
  }

  get user(): null | UserOfAuthorizer<Authorizer> {
    return this._user;
  }

  get channel(): null | WebviewConnection {
    return this._channel;
  }

  get authContext(): null | ContextOfAuthorizer<Authorizer> {
    return this._authClient.getAuthContext();
  }

  get platform(): string | undefined {
    return this._authClient.platform;
  }

  constructor({
    webSocketUrl,
    platform,
    authorizers,
    authApiUrl,
    mockupMode = false,
  }: ClientOptions<Authorizer>) {
    super();

    this._user = null;
    this._channel = null;
    this.isMockupMode = mockupMode;
    this._platformInput = platform;

    this._authClient = new AuthClient({
      authorizers,
      serverUrl: authApiUrl || DEFAULT_AUTH_PATH,
    });

    const marshalTypes = authorizers.reduce((types, authorizer) => {
      if (authorizer.marshalTypes) {
        types.push(...authorizer.marshalTypes);
      }
      return types;
    }, [] as AnyMarshalType[]);

    this._connector = new Connector<UserOfAuthorizer<Authorizer>>(
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
      this._authClient.signIn({ platform: this._platformInput }).catch();
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
    const authorizer = this._authClient.getAuthorizer();
    if (!authorizer) {
      return false;
    }

    return authorizer.closeWebview();
  }

  private async _getLoginAuth(): Promise<{
    user: UserOfAuthorizer<Authorizer>;
    credential: string;
  }> {
    const { token, context } = await this._authClient.signIn({
      platform: this._platformInput,
    });
    return {
      user: context.user as UserOfAuthorizer<Authorizer>,
      credential: token,
    };
  }

  private _handleConnect({
    connId,
    user,
  }: {
    connId: string;
    user: UserOfAuthorizer<Authorizer>;
  }) {
    this._user = user;
    this._channel = new WebviewConnection('*', connId);

    const connectEvent: ConnectEventValue = {
      category: 'connection',
      type: 'connect',
      payload: null,
    };

    this._emitEvent({
      event: createEvent(connectEvent, this._channel, user),
      auth: this.authContext as ContextOfAuthorizer<Authorizer>,
      authorizer: this._authClient.getAuthorizer() as Authorizer,
    } as ClientEventContext<Authorizer, Value>);
  }

  private _handleEvent(values: Value[]) {
    for (const value of values) {
      this._emitEvent({
        event: createEvent(
          value,
          this._channel as WebviewConnection,
          this._user as UserOfAuthorizer<Authorizer>
        ),
        auth: this.authContext as ContextOfAuthorizer<Authorizer>,
        authorizer: this._authClient.getAuthorizer() as Authorizer,
      } as ClientEventContext<Authorizer, Value>);
    }
  }

  private _handleDisconnect({ reason }: { reason: string }) {
    const channel = this._channel;
    this._channel = null;

    const disconnectValue: DisconnectEventValue = {
      category: 'connection',
      type: 'disconnect',
      payload: { reason },
    };

    this._emitEvent({
      event: createEvent(
        disconnectValue,
        channel as WebviewConnection,
        this._user as UserOfAuthorizer<Authorizer>
      ),
      auth: this.authContext as ContextOfAuthorizer<Authorizer>,
      authorizer: this._authClient.getAuthorizer() as Authorizer,
    } as ClientEventContext<Authorizer, Value>);
  }
}

export default WebviewClient;
