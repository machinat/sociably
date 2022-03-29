import type { IncomingMessage, ServerResponse } from 'http';
import { parse as parseUrl, URL } from 'url';
import { parse as parseAgent } from 'bowser';
import { getClientIp } from 'request-ip';
import Machinat, {
  makeClassProvider,
  MachinatChannel,
  StateController,
} from '@machinat/core';
import type { RoutingInfo } from '@machinat/http';
import HttpOperator from '../HttpOperator';
import { respondApiError, parseJsonBody } from '../utils';
import { ConfigsI } from '../interface';
import buildLoginPage from './buildLoginPage';
import {
  BasicAuthLoginState,
  BasicAuthVerifyState,
  BasicAuthState,
  BasicAuthOptions,
  CodeMessageComponent,
  AuthDelegatorOptions,
  VerifyCodeRequestBody,
  VerifyCodeResponseBody,
} from './types';

const VERIFY_RECORDS_SPACE = 'basic_auth_verify_records';
const RECORDS_TIME_INDEX = '$time_index';

const LOGIN_QUERY = 'login';

const respondVerify = (res: ServerResponse, body: VerifyCodeResponseBody) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const numericCode = (n: number) => {
  let code = '';
  for (let i = 0; i < n; i += 1) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
};

const DefaultCodeMessage = ({ code }) => <p>Your login code is: {code}</p>;

export class BasicAuthenticator {
  operator: HttpOperator;
  stateController: StateController;
  appName?: string;
  appImageUrl?: string;
  loginCodeDigits: number;
  codeMessageComponent: CodeMessageComponent;
  maxLoginAttempt: number;
  loginDurationTime: number;

  constructor(
    stateController: StateController,
    operator: HttpOperator,
    {
      appName,
      appImageUrl,
      loginCodeDigits = 6,
      maxLoginAttempt = 5,
      loginDuration = 300,
      codeMessageComponent = DefaultCodeMessage,
    }: BasicAuthOptions = {}
  ) {
    this.stateController = stateController;
    this.operator = operator;
    this.appName = appName;
    this.appImageUrl = appImageUrl;
    this.loginCodeDigits = loginCodeDigits;
    this.codeMessageComponent = codeMessageComponent;
    this.maxLoginAttempt = maxLoginAttempt;
    this.loginDurationTime = loginDuration * 1000;
  }

  createRequestDelegator<Data, Channel extends MachinatChannel>(
    options: AuthDelegatorOptions<Data, Channel>
  ) {
    return async (
      req: IncomingMessage,
      res: ServerResponse,
      { trailingPath }: RoutingInfo
    ): Promise<void> => {
      if (trailingPath === '') {
        await this._handleStart(req, res, options);
      } else if (trailingPath === 'login') {
        await this._handleLogin(req, res, options);
      } else if (trailingPath === 'verify') {
        await this._handleVerify(req, res, options);
      } else {
        res.writeHead(404);
        res.end();
      }
    };
  }

  getAuthUrl<Data>(platform: string, data: Data, redirectUrl?: string): string {
    const loginToken = this.operator.signToken(platform, { data, redirectUrl });
    const authRoot = new URL(this.operator.getAuthUrl(platform));

    authRoot.searchParams.set(LOGIN_QUERY, loginToken);
    return authRoot.href;
  }

  private async _handleStart<Data, Channel extends MachinatChannel>(
    req: IncomingMessage,
    res: ServerResponse,
    { platform, checkAuthData }: AuthDelegatorOptions<Data, Channel>
  ) {
    const {
      query: { [LOGIN_QUERY]: loginToken },
    } = parseUrl(req.url as string, true);

    // check the login query
    let payload: null | { data: Data; redirectUrl: undefined | string };
    if (
      typeof loginToken !== 'string' ||
      !(payload = this.operator.verifyToken(platform, loginToken))
    ) {
      respondApiError(res, platform, 400, 'invald login param');
      return;
    }

    // redirect if user is already logged in
    const { data, redirectUrl } = payload;
    const currentAuth = await this.operator.getAuth<Data>(req, platform, {
      acceptRefreshable: true,
    });
    if (currentAuth) {
      this.operator.redirect(res, redirectUrl, { assertInternal: true });
      return;
    }

    // check the auth data
    const checkResult = checkAuthData(data);
    if (!checkResult.ok) {
      const { code, reason } = checkResult;
      respondApiError(res, platform, code, reason);
      return;
    }
    const { data: checkedData, channel } = checkResult;

    // redirect to login page if it's during the login process
    const loginUrl = this.operator.getAuthUrl(platform, 'login');
    const currentState = await this.operator.getState<BasicAuthState<Data>>(
      req,
      platform
    );
    if (currentState && currentState.ch === channel.uid) {
      this.operator.redirect(res, loginUrl);
      return;
    }

    await this.operator.issueState<BasicAuthLoginState<Data>>(res, platform, {
      status: 'login',
      ch: channel.uid,
      data: checkedData,
      redirect: redirectUrl,
    });

    res.setHeader('X-Robots-Tag', 'none');
    this.operator.redirect(res, loginUrl);
  }

  private async _handleLogin<Data, Channel extends MachinatChannel>(
    req: IncomingMessage,
    res: ServerResponse,
    {
      bot,
      platform,
      platformName,
      platformColor,
      platformImageUrl,
      checkAuthData,
      getChatLink,
    }: AuthDelegatorOptions<Data, Channel>
  ) {
    const now = Date.now();
    const state = await this.operator.getState<BasicAuthState<Data>>(
      req,
      platform
    );
    if (!state) {
      await this.operator.issueError(
        res,
        platform,
        401,
        'login session expired'
      );
      this.operator.redirect(res);
      return;
    }

    const checkResult = checkAuthData(state.data);
    if (!checkResult.ok) {
      const { code, reason } = checkResult;
      await this.operator.issueError(res, platform, code, reason);
      this.operator.redirect(res, state.redirect);
      return;
    }
    const { data: checkedData, channel } = checkResult;

    let shouldIssueCode = true;
    if (state.status === 'verify' && now - state.ts < this.loginDurationTime) {
      const verifyCount = await this._checkVerifyCount(
        state.ch,
        state.ts,
        false
      );
      if (verifyCount < this.maxLoginAttempt) {
        shouldIssueCode = false;
      }
    }

    // send login code in chatroom
    if (shouldIssueCode) {
      const code = numericCode(this.loginCodeDigits);
      const CodeMessage = this.codeMessageComponent;

      const { headers } = req;
      const agentHeader = headers['user-agent'];
      const agent = agentHeader ? parseAgent(agentHeader) : null;
      const domain = new URL(this.operator.getRedirectUrl(state.redirect))
        .hostname;
      try {
        await bot.render(
          channel,
          <CodeMessage
            code={code}
            domain={domain}
            ip={getClientIp(req)}
            osName={agent?.os.name}
            deviceModel={agent?.platform.model}
            deviceType={agent?.platform.type}
            browserName={agent?.browser.name}
          />
        );
      } catch {
        await this.operator.issueError(
          res,
          platform,
          510,
          'fail to send login code'
        );
        this.operator.redirect(res, state.redirect);
        return;
      }

      // save data and encrypted code in state
      const hashedCode = this._signCodeSignature(
        platform,
        channel.uid,
        now,
        code
      );
      await this.operator.issueState<BasicAuthVerifyState<Data>>(
        res,
        platform,
        {
          status: 'verify',
          ch: channel.uid,
          ts: now,
          data: checkedData,
          hash: hashedCode,
          redirect: state.redirect,
        }
      );
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(
      buildLoginPage({
        appName: this.appName,
        appImageUrl: this.appImageUrl,
        loginCodeDigits: this.loginCodeDigits,
        platformName,
        platformColor,
        platformImageUrl,
        chatLinkUrl: getChatLink(checkResult.channel),
      })
    );
  }

  private async _handleVerify<Data, Channel extends MachinatChannel>(
    req: IncomingMessage,
    res: ServerResponse,
    { platform }: AuthDelegatorOptions<Data, Channel>
  ) {
    const body: VerifyCodeRequestBody = await parseJsonBody(req);
    if (!body || !body.code) {
      respondApiError(res, platform, 400, 'invalid request');
      return;
    }
    const { code } = body;

    const state = await this.operator.getState<BasicAuthState<Data>>(
      req,
      platform
    );
    if (
      !state ||
      state.status !== 'verify' ||
      Date.now() - state.ts > this.loginDurationTime
    ) {
      await this.operator.issueError(
        res,
        platform,
        401,
        'login session expired'
      );
      respondVerify(res, {
        ok: false,
        retryChances: 0,
        redirectTo: this.operator.getRedirectUrl(state?.redirect),
      });
      return;
    }

    const { data, hash, ch, ts, redirect } = state;

    const hashedCode = this._signCodeSignature(platform, ch, ts, code);
    const isCodeMatched = hashedCode === hash;
    const verifyCount = await this._checkVerifyCount(ch, ts, !isCodeMatched);

    const isOk = isCodeMatched && verifyCount < this.maxLoginAttempt;
    const retryChances = isOk ? 0 : this.maxLoginAttempt - verifyCount;

    if (isOk) {
      await this.operator.issueAuth(res, platform, data);
    } else if (retryChances === 0) {
      await this.operator.issueError(
        res,
        platform,
        401,
        'invalid login verify code'
      );
    }

    respondVerify(res, {
      ok: isOk,
      retryChances,
      redirectTo: this.operator.getRedirectUrl(redirect),
    });
  }

  private _signCodeSignature(
    platform: string,
    ch: string,
    ts: number,
    code: string
  ) {
    const [, , hashedCode] = this.operator
      .signToken(platform, `${ch}:${ts}:${code}`, { noTimestamp: true })
      .split('.', 3);
    return hashedCode;
  }

  private async _checkVerifyCount(
    channelUid: string,
    timestamp: number,
    incremental: boolean
  ): Promise<number> {
    const now = Date.now();
    const recordsState = this.stateController.globalState(VERIFY_RECORDS_SPACE);

    const verifyCount = await recordsState.update<number>(
      `${channelUid}:${timestamp}`,
      (count) => {
        if (incremental && (!count || count < this.maxLoginAttempt)) {
          return (count || 0) + 1;
        }
        return count;
      }
    );

    // update index and clean records
    let recordsToClear: { ch: string; ts: number }[] = [];

    if (incremental && verifyCount === 1) {
      const record = { ts: timestamp, ch: channelUid };

      await recordsState.update<{ ch: string; ts: number }[]>(
        RECORDS_TIME_INDEX,
        (currentRecords = []) => {
          const idxToKeep = currentRecords.findIndex(
            ({ ts }) => now - ts < this.loginDurationTime
          );
          if (idxToKeep === -1) {
            recordsToClear = currentRecords;
            return [record];
          }

          const records = currentRecords.slice(idxToKeep);
          recordsToClear = currentRecords.slice(0, idxToKeep);
          let idxToInsert = 0;

          for (let i = records.length - 1; i >= 0; i -= 1) {
            if (timestamp > records[i].ts) {
              idxToInsert = i + 1;
              break;
            }
          }
          records.splice(idxToInsert, 0, record);
          return records;
        }
      );
    }

    await Promise.all(
      recordsToClear.map(({ ts, ch }) => recordsState.delete(`${ch}:${ts}`))
    );
    return verifyCount || 0;
  }
}

const AuthenticatorP = makeClassProvider({
  deps: [StateController, HttpOperator, ConfigsI],
  factory: (stateController, httpOperator, configs) =>
    new BasicAuthenticator(stateController, httpOperator, {
      ...configs.basicAuth,
      loginDuration:
        configs.basicAuth?.loginDuration || configs.dataCookieMaxAge,
    }),
})(BasicAuthenticator);

type AuthenticatorP = BasicAuthenticator;

export default AuthenticatorP;
