import type { IncomingMessage, ServerResponse } from 'http';
import { parse as parseUrl, URL } from 'url';
import Bowser from 'bowser';
import { getClientIp } from 'request-ip';
import Sociably, {
  serviceProviderClass,
  SociablyThread,
  StateController,
} from '@sociably/core';
import type { RoutingInfo } from '@sociably/http';
import HttpOperator from '../HttpOperator.js';
import { respondApiError, parseJsonBody } from '../utils.js';
import { ConfigsI } from '../interface.js';
import buildLoginPage from './buildLoginPage.js';
import {
  BasicAuthLoginState,
  BasicAuthVerifyState,
  BasicAuthState,
  BasicAuthOptions,
  CodeMessageComponent,
  AuthDelegatorOptions,
  VerifyCodeRequestBody,
  VerifyCodeResponseBody,
} from './types.js';

const { parse: parseAgent } = Bowser;

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

type InitPayload<Credential> = {
  credential: Credential;
  redirectUrl: undefined | string;
};

export class BasicAuthenticator {
  mode: 'strict' | 'loose';
  operator: HttpOperator;
  stateController: StateController;
  appName?: string;
  appIconUrl?: string;
  loginCodeDigits: number;
  codeMessageComponent: CodeMessageComponent;
  maxLoginAttempt: number;
  loginDurationTime: number;

  constructor(
    stateController: StateController,
    operator: HttpOperator,
    {
      appName,
      appIconUrl,
      mode = 'strict',
      loginCodeDigits = 6,
      maxLoginAttempt = 5,
      loginDuration = 600,
      codeMessageComponent = DefaultCodeMessage,
    }: BasicAuthOptions = {},
  ) {
    this.mode = mode;
    this.stateController = stateController;
    this.operator = operator;
    this.appName = appName;
    this.appIconUrl = appIconUrl;
    this.loginCodeDigits = loginCodeDigits;
    this.codeMessageComponent = codeMessageComponent;
    this.maxLoginAttempt = maxLoginAttempt;
    this.loginDurationTime = loginDuration * 1000;
  }

  createRequestDelegator<Credential, Data, Thread extends SociablyThread>(
    options: AuthDelegatorOptions<Credential, Data, Thread>,
  ) {
    return async (
      req: IncomingMessage,
      res: ServerResponse,
      { trailingPath }: RoutingInfo,
    ): Promise<void> => {
      if (trailingPath === 'init') {
        await this._handleInit(req, res, options);
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

  getAuthUrl<Credential>(
    platform: string,
    credential: Credential,
    redirectUrl?: string,
  ): string {
    const payload: InitPayload<Credential> = { credential, redirectUrl };
    const loginToken = this.operator.signToken(platform, payload);
    const authRoot = new URL(this.operator.getAuthUrl(platform, 'init'));

    authRoot.searchParams.set(LOGIN_QUERY, loginToken);
    return authRoot.href;
  }

  private async _handleInit<Credential, Data, Thread extends SociablyThread>(
    req: IncomingMessage,
    res: ServerResponse,
    {
      platform,
      checkCurrentAuthUsability,
      verifyCredential,
      checkAuthData,
    }: AuthDelegatorOptions<Credential, Data, Thread>,
  ) {
    const {
      query: { [LOGIN_QUERY]: loginToken },
    } = parseUrl(req.url!, true);

    // check the login query
    const payload =
      typeof loginToken === 'string'
        ? this.operator.verifyToken<InitPayload<Credential>>(
            platform,
            loginToken,
          )
        : null;
    if (!payload) {
      await this._redirectError(res, platform, 400, 'invalid login param');
      return;
    }
    const { credential, redirectUrl } = payload;

    // redirect if user is already logged in
    const currentAuth = await this.operator.getAuth<Data>(req, platform, {
      acceptRefreshable: true,
    });
    if (currentAuth && checkCurrentAuthUsability(credential, currentAuth).ok) {
      this.operator.redirect(res, redirectUrl, { assertInternal: true });
      return;
    }

    // check auth data
    const verifyResult = await verifyCredential(credential);
    if (!verifyResult.ok) {
      const { code, reason } = verifyResult;
      await this._redirectError(res, platform, code, reason, redirectUrl);
      return;
    }

    const checkResult = checkAuthData(verifyResult.data);
    if (!checkResult.ok) {
      const { code, reason } = checkResult;
      await this._redirectError(res, platform, code, reason, redirectUrl);
      return;
    }

    // skip verifying code in 'loose' mode
    if (this.mode === 'loose') {
      await this.operator.issueAuth(res, platform, verifyResult.data);
      this.operator.redirect(res, redirectUrl, { assertInternal: true });
      return;
    }

    const { data: verifiedData, thread } = checkResult;

    // redirect to login page in 'strict' mode
    const currentState = await this.operator.getState<BasicAuthState<Data>>(
      req,
      platform,
    );

    if (!currentState || currentState.ch !== thread.uid) {
      await this.operator.issueState<BasicAuthLoginState<Data>>(res, platform, {
        status: 'login',
        ch: thread.uid,
        data: verifiedData,
        redirect: redirectUrl,
      });
    }

    const loginUrl = this.operator.getAuthUrl(platform, 'login');
    res.setHeader('X-Robots-Tag', 'none');
    this.operator.redirect(res, loginUrl);
  }

  private async _handleLogin<Data, Thread extends SociablyThread>(
    req: IncomingMessage,
    res: ServerResponse,
    {
      bot,
      platform,
      platformName,
      platformColor,
      platformImageUrl,
      checkAuthData,
    }: AuthDelegatorOptions<unknown, Data, Thread>,
  ) {
    const now = Date.now();
    const state = await this.operator.getState<BasicAuthState<Data>>(
      req,
      platform,
    );
    if (!state) {
      await this._redirectError(res, platform, 401, 'login session expired');
      return;
    }

    const checkResult = checkAuthData(state.data);
    if (!checkResult.ok) {
      const { code, reason } = checkResult;
      await this._redirectError(res, platform, code, reason, state.redirect);
      return;
    }
    const { data: checkedData, thread, chatLinkUrl } = checkResult;

    let shouldIssueCode = true;
    if (state.status === 'verify' && now - state.ts < this.loginDurationTime) {
      const verifyCount = await this._checkVerifyCount(
        state.ch,
        state.ts,
        false,
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
          thread,
          <CodeMessage
            code={code}
            domain={domain}
            ip={getClientIp(req) ?? undefined}
            osName={agent?.os.name}
            deviceModel={agent?.platform.model}
            deviceType={agent?.platform.type}
            browserName={agent?.browser.name}
          />,
        );
      } catch {
        await this._redirectError(
          res,
          platform,
          510,
          'fail to send login code',
          state.redirect,
        );
        return;
      }

      // save data and encrypted code in state
      const hashedCode = this._signCodeSignature(
        platform,
        thread.uid,
        now,
        code,
      );
      await this.operator.issueState<BasicAuthVerifyState<Data>>(
        res,
        platform,
        {
          status: 'verify',
          ch: thread.uid,
          ts: now,
          data: checkedData,
          hash: hashedCode,
          redirect: state.redirect,
        },
      );
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(
      buildLoginPage({
        appName: this.appName,
        appIconUrl: this.appIconUrl,
        loginCodeDigits: this.loginCodeDigits,
        platformName,
        platformColor,
        platformImageUrl,
        chatLinkUrl,
      }),
    );
  }

  private async _handleVerify<Data, Thread extends SociablyThread>(
    req: IncomingMessage,
    res: ServerResponse,
    { platform }: AuthDelegatorOptions<unknown, Data, Thread>,
  ) {
    const body: VerifyCodeRequestBody = await parseJsonBody(req);
    if (!body?.code) {
      respondApiError(res, platform, 400, 'invalid request');
      return;
    }
    const { code } = body;

    const state = await this.operator.getState<BasicAuthState<Data>>(
      req,
      platform,
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
        'login session expired',
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
        'invalid login verify code',
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
    code: string,
  ) {
    const [, , hashedCode] = this.operator
      .signToken(platform, `${ch}:${ts}:${code}`, { noTimestamp: true })
      .split('.', 3);
    return hashedCode;
  }

  private async _redirectError(
    res: ServerResponse,
    platform: string,
    code: number,
    reason: string,
    redirectUrl?: string,
  ) {
    await this.operator.issueError(res, platform, code, reason);
    this.operator.redirect(res, redirectUrl, { assertInternal: true });
  }

  private async _checkVerifyCount(
    threadUid: string,
    timestamp: number,
    incremental: boolean,
  ): Promise<number> {
    const now = Date.now();
    const recordsState = this.stateController.globalState(VERIFY_RECORDS_SPACE);

    const verifyCount = await recordsState.update<number>(
      `${threadUid}:${timestamp}`,
      (count) => {
        if (incremental && (!count || count < this.maxLoginAttempt)) {
          return (count || 0) + 1;
        }
        return count;
      },
    );

    // update index and clean records
    let recordsToClear: { ch: string; ts: number }[] = [];

    if (incremental && verifyCount === 1) {
      const record = { ts: timestamp, ch: threadUid };

      await recordsState.update<{ ch: string; ts: number }[]>(
        RECORDS_TIME_INDEX,
        (currentRecords = []) => {
          const idxToKeep = currentRecords.findIndex(
            ({ ts }) => now - ts < this.loginDurationTime,
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
        },
      );
    }

    await Promise.all(
      recordsToClear.map(({ ts, ch }) => recordsState.delete(`${ch}:${ts}`)),
    );
    return verifyCount || 0;
  }
}

const AuthenticatorP = serviceProviderClass({
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
