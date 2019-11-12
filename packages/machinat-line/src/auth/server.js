// @flow
import invariant from 'invariant';
import fetch from 'node-fetch';
import type { IncomingMessage, ServerResponse } from 'http';
import type { AuthData, ServerAuthProvider } from 'machinat-auth/types';
import { LINE } from '../constant';
import { LineUser } from '../user';
import { LineAPIError } from '../error';
import type { LIFFAuthData, RawLineUserProfile } from '../types';
import { refineLIFFContextData } from './utils';

type LineServerAuthProviderOpts = {
  channelId: string,
};

class LineServerAuthProvider implements ServerAuthProvider<LIFFAuthData> {
  options: LineServerAuthProviderOpts;
  platform = LINE;

  constructor(options: LineServerAuthProviderOpts) {
    invariant(
      options && options.channelId,
      'options.channelId must not be empty'
    );

    this.options = options;
  }

  // eslint-disable-next-line class-methods-use-this
  async handleAuthRequest(req: IncomingMessage, res: ServerResponse) {
    res.writeHead(403);
    res.end();
  }

  async verifyAuthData({ data }: AuthData<LIFFAuthData>) {
    if (!data || !data.accessToken) {
      throw new LineAPIError(400, { message: 'Empty accessToken received' });
    }

    const response = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    });

    if (!response.ok) {
      const body = await response.json();
      throw new LineAPIError(response.status, body);
    }

    const rawProfile: RawLineUserProfile = await response.json();

    return {
      user: new LineUser(this.options.channelId, rawProfile.userId),
      channel: null,
      loginAt: new Date(data.loginTime),
      data: {
        ...data,
        profile: rawProfile,
      },
    };
  }

  async refineAuthData({ data }: AuthData<LIFFAuthData>) {
    return refineLIFFContextData(this.options.channelId, data);
  }
}

export default LineServerAuthProvider;
