import type { IncomingMessage, ServerResponse } from 'http';
import { parse as parseUrl, URL } from 'url';
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
  BasicAuthState,
  BasicAuthOptions,
  CodeMessageComponent,
  AuthDelegatorOptions,
  VerifyCodeRequestBody,
  VerifyCodeResponseBody,
} from './types';

const VERIFY_RECORDS_SPACE = 'basic_auth_verify_records';
const RECORDS_TIME_INDEX = '$time_index';
const VERIFY_ALLOWANCE_TIME = 180000;
const VERIFY_COUNT_LIMIT = 4;

const LOGIN_QUERY = 'login';
const DEFAULT_LOGIN_CODE_DIGITS = 6;

const numericCode = (n: number) => {
  let code = '';
  for (let i = 0; i < n; i += 1) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
};

export class BasicServerAuthenticator {
  operator: HttpOperator;
  stateController: StateController;
  options: BasicAuthOptions;
  CodeMessage: CodeMessageComponent;

  constructor(
    stateController: StateController,
    operator: HttpOperator,
    options: BasicAuthOptions = {}
  ) {
    this.stateController = stateController;
    this.operator = operator;
    this.options = options;
    this.CodeMessage =
      options.codeMessageComponent ||
      (({ code }) => <p>Your login code is: {code}</p>);
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

  getLoginUrl<Data>(
    platform: string,
    data: Data,
    redirectUrl?: string
  ): string {
    const loginToken = this.operator.signToken(platform, { data, redirectUrl });
    const authRoot = new URL(this.operator.getAuthUrl(platform));

    authRoot.searchParams.set(LOGIN_QUERY, loginToken);
    return authRoot.href;
  }

  private async _handleStart<Data, Channel extends MachinatChannel>(
    req: IncomingMessage,
    res: ServerResponse,
    { bot, platform, checkAuthData }: AuthDelegatorOptions<Data, Channel>
  ) {
    const {
      query: { [LOGIN_QUERY]: loginToken },
    } = parseUrl(req.url as string, true);
    const now = Date.now();

    // check the login query
    let payload: null | { data: Data; redirectUrl: undefined | string };
    if (
      typeof loginToken !== 'string' ||
      !(payload = this.operator.verifyToken(platform, loginToken))
    ) {
      respondApiError(res, platform, 400, 'invald login param');
      return;
    }

    // redirect to target if it's already logged in
    const { data, redirectUrl } = payload;
    const currentAuth = await this.operator.getAuth<Data>(req, platform);
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
    const currentState = await this.operator.getState<BasicAuthState<Data>>(
      req,
      platform
    );
    if (
      currentState &&
      currentState.ch === channel.uid &&
      now - currentState.ts < VERIFY_ALLOWANCE_TIME
    ) {
      const verifyCount = await this._checkVerifyCount(
        currentState.ch,
        currentState.ts,
        false
      );

      if (verifyCount && verifyCount < VERIFY_COUNT_LIMIT) {
        this.operator.redirect(
          res,
          this.operator.getAuthUrl(platform, 'login')
        );
        return;
      }
    }

    // send login code in chatroom
    const code = numericCode(
      this.options.verifyCodeDigits || DEFAULT_LOGIN_CODE_DIGITS
    );
    try {
      await bot.render(
        channel,
        Machinat.createElement(this.CodeMessage, { code, channel })
      );
    } catch {
      await this.operator.issueError(
        res,
        platform,
        510,
        'fail to send login code'
      );
      this.operator.redirect(res, redirectUrl);
      return;
    }

    // save data and encrypted code in state
    const hashedCode = this._signCodeSignature(
      platform,
      channel.uid,
      now,
      code
    );
    await this.operator.issueState<BasicAuthState<Data>>(res, platform, {
      ch: channel.uid,
      ts: now,
      data: checkedData,
      hash: hashedCode,
      redirect: redirectUrl,
    });
    this.operator.redirect(res, this.operator.getAuthUrl(platform, 'login'));
  }

  private async _handleLogin<Data, Channel extends MachinatChannel>(
    req: IncomingMessage,
    res: ServerResponse,
    {
      platform,
      platformName,
      platformColor,
      platformImageUrl,
      checkAuthData,
      getChatLink,
    }: AuthDelegatorOptions<Data, Channel>
  ) {
    const state = await this.operator.getState<BasicAuthState<Data>>(
      req,
      platform
    );
    if (!state) {
      await this.operator.issueError(res, platform, 401, 'invalid login flow');
      this.operator.redirect(res);
      return;
    }

    const checkResult = checkAuthData(state.data);
    if (!checkResult.ok) {
      const { code, reason } = checkResult;
      await this.operator.issueError(res, platform, code, reason);
      this.operator.redirect(res);
      return;
    }

    const { appName, appImageUrl } = this.options;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(
      buildLoginPage({
        appName,
        appImageUrl,
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
    if (!state) {
      respondApiError(res, platform, 400, 'invalid login flow');
      return;
    }

    const { data, hash, ch, ts, redirect } = state;
    const hashedCode = this._signCodeSignature(platform, ch, ts, code);
    const isCodeMatched = hashedCode === hash;

    const verifyCount = await this._checkVerifyCount(ch, ts, !isCodeMatched);
    const isOk =
      isCodeMatched && (!verifyCount || verifyCount < VERIFY_COUNT_LIMIT);

    if (isOk) {
      await this.operator.issueAuth(res, platform, data);
    } else {
      await this.operator.issueError(
        res,
        platform,
        401,
        'invalid login verify code'
      );
    }

    const responseBody: VerifyCodeResponseBody = {
      ok: isCodeMatched && (!verifyCount || verifyCount < VERIFY_COUNT_LIMIT),
      retryChances: verifyCount ? VERIFY_COUNT_LIMIT - verifyCount : 0,
      redirectTo: this.operator.getRedirectUrl(redirect),
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(responseBody));
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
  ) {
    const now = Date.now();
    const recordsState = this.stateController.globalState(VERIFY_RECORDS_SPACE);

    const verifyCount = await recordsState.update<number>(
      `${channelUid}:${timestamp}`,
      (count) => {
        if (now - timestamp > VERIFY_ALLOWANCE_TIME) {
          return undefined;
        }
        if (incremental && (!count || count < VERIFY_COUNT_LIMIT)) {
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
            ({ ts }) => now - ts < VERIFY_ALLOWANCE_TIME
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
    return verifyCount;
  }
}

const AuthenticatorP = makeClassProvider({
  deps: [StateController, HttpOperator, ConfigsI],
  factory: (stateController, httpOperator, configs) =>
    new BasicServerAuthenticator(
      stateController,
      httpOperator,
      configs.basicAuth
    ),
})(BasicServerAuthenticator);

type AuthenticatorP = BasicServerAuthenticator;

export default AuthenticatorP;
