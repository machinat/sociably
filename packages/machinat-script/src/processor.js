// @flow
import invariant from 'invariant';
import { StateControllerI } from '@machinat/core/base';
import { ServiceScope, provider } from '@machinat/core/service';
import type { MachinatChannel, MachinatNode } from '@machinat/core/types';
import execute from './execute';
import { SCRIPT_STATE_KEY, SCRIPT_LIBS_I } from './constant';
import { serializeScriptStatus } from './utils';
import type { MachinatScript, CallStatus, ScriptProcessState } from './types';

type RuntimeResult<Vars, Input, ReturnValue> = {
  finished: boolean,
  filterPassed: boolean,
  content: MachinatNode,
  currentScript: null | MachinatScript<Vars, Input, ReturnValue>,
  stopAt: void | string,
};

class ScriptRuntime {
  channel: MachinatChannel;
  callStack: null | CallStatus<any, any, any>[];
  saveTimestamp: void | number;
  _serviceScope: ServiceScope;
  _isPrompting: boolean;

  constructor(
    scope: ServiceScope,
    channel: MachinatChannel,
    stack: CallStatus<any, any, any>[],
    promptPointTs?: number
  ) {
    this.channel = channel;
    this._serviceScope = scope;
    this.callStack = stack;
    this.saveTimestamp = promptPointTs;
    this._isPrompting = !!promptPointTs;
  }

  get isFinished() {
    return !this.callStack;
  }

  get isPrompting() {
    return this._isPrompting;
  }

  async run(input?: any): Promise<RuntimeResult<any, any, any>> {
    if (!this.callStack) {
      return {
        finished: true,
        filterPassed: false,
        content: null,
        currentScript: null,
        stopAt: undefined,
      };
    }

    const { finished, filterPassed, stack, content } = await execute(
      this._serviceScope,
      this.channel,
      this.callStack,
      this._isPrompting,
      input
    );
    this.callStack = stack;
    this._isPrompting = !finished;

    const lastCallStatus = stack?.[stack.length - 1];

    return {
      finished,
      filterPassed,
      content,
      currentScript: lastCallStatus?.script || null,
      stopAt: lastCallStatus?.stopAt,
    };
  }
}

type InitRuntimeOptions<Vars> = {
  vars?: Vars,
  goto?: string,
};

class ScriptProcessor {
  _stateContoller: StateControllerI;
  _serviceScope: ServiceScope;
  _libs: Map<string, MachinatScript<any, any, any>>;

  constructor(
    stateManager: StateControllerI,
    scope: ServiceScope,
    scripts: MachinatScript<any, any, any>[]
  ) {
    this._stateContoller = stateManager;
    this._serviceScope = scope;

    const libs = new Map();
    for (const script of scripts) {
      invariant(
        !libs.has(script.name),
        `script name "${script.name}" duplicated`
      );
      libs.set(script.name, script);
    }

    this._libs = libs;
  }

  async init(
    channel: MachinatChannel,
    script: MachinatScript<any, any, any>,
    { vars = {}, goto }: InitRuntimeOptions<any> = {}
  ): Promise<ScriptRuntime> {
    const state = await this._stateContoller
      .channelState(channel)
      .get<ScriptProcessState>(SCRIPT_STATE_KEY);

    if (state) {
      throw new Error(
        `executing runtime existed on channel "${channel.uid}", cannot init until finished or exited`
      );
    }

    return new ScriptRuntime(this._serviceScope, channel, [
      { script, vars, stopAt: goto },
    ]);
  }

  async continue(channel: MachinatChannel): Promise<null | ScriptRuntime> {
    const state = await this._stateContoller
      .channelState(channel)
      .get<ScriptProcessState>(SCRIPT_STATE_KEY);

    if (!state) {
      return null;
    }

    const statusStack = [];
    for (const { name, vars, stopAt } of state.callStack) {
      const script = this._libs.get(name);
      invariant(script, `"${name}" not found in linked scripts`);

      statusStack.push({ script, vars, stopAt });
    }

    return new ScriptRuntime(
      this._serviceScope,
      channel,
      statusStack,
      state.timestamp
    );
  }

  async exit(channel: MachinatChannel): Promise<boolean> {
    const isDeleted = await this._stateContoller
      .channelState(channel)
      .delete(SCRIPT_STATE_KEY);
    return isDeleted;
  }

  async save(runtime: ScriptRuntime): Promise<boolean> {
    const { channel, callStack, saveTimestamp } = runtime;
    if (!callStack && !saveTimestamp) {
      return false;
    }

    const timestamp = Date.now();
    await this._stateContoller
      .channelState(channel)
      .set<ScriptProcessState>(SCRIPT_STATE_KEY, (lastState) => {
        if (
          saveTimestamp
            ? !(lastState && lastState.timestamp === saveTimestamp)
            : lastState
        ) {
          throw new Error(
            'runtime state have changed while execution, there are maybe ' +
              'mutiple runtimes of the same channel executing at the same time'
          );
        }

        return callStack
          ? {
              version: 'V0',
              callStack: callStack.map(serializeScriptStatus),
              timestamp,
            }
          : undefined;
      });

    runtime.saveTimestamp = timestamp; // eslint-disable-line no-param-reassign
    return true;
  }
}

export default provider<ScriptProcessor>({
  lifetime: 'scoped',
  deps: [StateControllerI, ServiceScope, SCRIPT_LIBS_I],
})(ScriptProcessor);
