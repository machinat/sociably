// @flow
import invariant from 'invariant';
import StateManager from '@machinat/state';
import { provider } from '@machinat/core/service';
import type { MachinatChannel, MachinatNode } from '@machinat/core/types';
import execute from './execute';
import { SCRIPT_STATE_KEY, SCRIPT_LIBS_I } from './constant';
import { serializeScriptStatus } from './utils';
import type { MachinatScript, CallStatus, ScriptProcessState } from './types';

type RuntimeResult<Vars, Input> = {
  finished: boolean,
  content: MachinatNode,
  currentScript: null | MachinatScript<Vars, Input>,
  stoppedAt: void | string,
};

class ScriptRuntime<Vars, Input> {
  channel: MachinatChannel;
  callStack: null | CallStatus<Vars, Input>[];
  saveTimestamp: void | number;
  _isPrompting: boolean;

  constructor(
    channel: MachinatChannel,
    stack: CallStatus<Vars, Input>[],
    promptPointTs?: number
  ) {
    this.channel = channel;
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

  async run(input?: Input): Promise<RuntimeResult<Vars, Input>> {
    if (!this.callStack) {
      return {
        finished: true,
        content: null,
        currentScript: null,
        stoppedAt: undefined,
      };
    }

    const { finished, stack, content } = execute(
      this.callStack,
      this._isPrompting,
      input
    );
    this.callStack = stack;
    this._isPrompting = !finished;

    const lastCallStatus = stack?.[stack.length - 1];

    return {
      finished,
      content,
      currentScript: lastCallStatus?.script || null,
      stoppedAt: lastCallStatus?.stoppedAt,
    };
  }
}

type InitRuntimeOptions<Vars> = {
  vars?: Vars,
  goto?: string,
};

class ScriptProcessor<Vars, Input> {
  _stateManager: StateManager;
  _libs: Map<string, MachinatScript<Vars, Input>>;

  constructor(
    stateManager: StateManager,
    scripts: MachinatScript<Vars, Input>[]
  ) {
    this._stateManager = stateManager;

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
    script: MachinatScript<Vars, Input>,
    { vars = {}, goto }: InitRuntimeOptions<Vars> = {}
  ): Promise<ScriptRuntime<Vars, Input>> {
    const state = await this._stateManager
      .channelState(channel)
      .get<ScriptProcessState<Vars>>(SCRIPT_STATE_KEY);

    if (state) {
      throw new Error(
        `executing runtime existed on channel "${channel.uid}", cannot init until finished or exited`
      );
    }

    return new ScriptRuntime(channel, [{ script, vars, stoppedAt: goto }]);
  }

  async continue(
    channel: MachinatChannel
  ): Promise<null | ScriptRuntime<Vars, Input>> {
    const state = await this._stateManager
      .channelState(channel)
      .get<ScriptProcessState<Vars>>(SCRIPT_STATE_KEY);

    if (!state) {
      return null;
    }

    const statusStack = [];
    for (const { name, vars, stoppedAt } of state.callStack) {
      const script = this._libs.get(name);
      invariant(script, `"${name}" not found in linked scripts`);

      statusStack.push({ script, vars, stoppedAt });
    }

    return new ScriptRuntime(channel, statusStack, state.timestamp);
  }

  async exit(channel: MachinatChannel): Promise<boolean> {
    const isDeleted = await this._stateManager
      .channelState(channel)
      .delete(SCRIPT_STATE_KEY);
    return isDeleted;
  }

  async saveRuntime(runtime: ScriptRuntime<Vars, Input>): Promise<boolean> {
    const { channel, callStack, saveTimestamp } = runtime;
    if (!callStack && !saveTimestamp) {
      return false;
    }

    const timestamp = Date.now();
    await this._stateManager
      .channelState(channel)
      .set<ScriptProcessState<Vars>>(SCRIPT_STATE_KEY, lastState => {
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

export default provider<ScriptProcessor<any, any>>({
  lifetime: 'singleton',
  deps: [StateManager, SCRIPT_LIBS_I],
})(ScriptProcessor);
