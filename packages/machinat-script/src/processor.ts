import invariant from 'invariant';
import Base from '@machinat/core/base';
import { ServiceScope, provider } from '@machinat/core/service';
import type { MachinatChannel, MachinatNode } from '@machinat/core/types';
import execute from './execute';
import { SCRIPT_STATE_KEY, SCRIPT_LIBS_I } from './constant';
import { serializeScriptStatus } from './utils';
import type { MachinatScript, CallStatus, ScriptProcessState } from './types';

type RuntimeResult<ReturnValue> = {
  finished: boolean;
  returnValue: void | ReturnValue;
  filterPassed: boolean;
  content: MachinatNode;
};

export class ScriptRuntime<Input, ReturnValue> {
  channel: MachinatChannel;
  callStack: null | CallStatus<any, Input, ReturnValue>[];
  saveTimestamp: void | number;
  private _serviceScope: ServiceScope;
  private _isPrompting: boolean;

  constructor(
    scope: ServiceScope,
    channel: MachinatChannel,
    stack: CallStatus<any, Input, ReturnValue>[],
    promptPointTs?: number
  ) {
    this.channel = channel;
    this._serviceScope = scope;
    this.callStack = stack;
    this.saveTimestamp = promptPointTs;
    this._isPrompting = !!promptPointTs;
  }

  get isFinished(): boolean {
    return !this.callStack;
  }

  get isPrompting(): boolean {
    return this._isPrompting;
  }

  get currentScript(): null | MachinatScript<any, Input, ReturnValue, any> {
    const stack = this.callStack;
    return stack?.[stack.length - 1].script || null;
  }

  get stopAt(): void | string {
    const stack = this.callStack;
    return stack?.[stack.length - 1].stopAt;
  }

  async run(input?: Input): Promise<RuntimeResult<ReturnValue>> {
    if (!this.callStack) {
      return {
        finished: true,
        returnValue: undefined,
        filterPassed: false,
        content: null,
      };
    }

    const {
      finished,
      returnValue,
      filterPassed,
      stack,
      content,
    } = await execute(
      this._serviceScope,
      this.channel,
      this.callStack,
      this._isPrompting,
      input
    );
    this.callStack = stack;
    this._isPrompting = !finished;

    return {
      finished,
      returnValue,
      filterPassed,
      content,
    };
  }
}

type InitRuntimeOptions<Vars> = {
  vars?: Vars;
  goto?: string;
};

export class ScriptProcessor<Input, ReturnValue> {
  private _stateContoller: Base.StateControllerI;
  private _serviceScope: ServiceScope;
  private _libs: Map<string, MachinatScript<any, Input, ReturnValue, any>>;

  constructor(
    stateManager: Base.StateControllerI,
    scope: ServiceScope,
    scripts: MachinatScript<any, Input, ReturnValue, any>[]
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

  async init<Vars>(
    channel: MachinatChannel,
    script: MachinatScript<Vars, Input, ReturnValue, any>,
    { vars = {} as Vars, goto }: InitRuntimeOptions<Vars> = {}
  ): Promise<ScriptRuntime<Input, ReturnValue>> {
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

  async continue(
    channel: MachinatChannel
  ): Promise<null | ScriptRuntime<Input, ReturnValue>> {
    const state = await this._stateContoller
      .channelState(channel)
      .get<ScriptProcessState>(SCRIPT_STATE_KEY);

    if (!state) {
      return null;
    }

    const statusStack: CallStatus<any, Input, ReturnValue>[] = [];
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

  async save(runtime: ScriptRuntime<Input, ReturnValue>): Promise<boolean> {
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

export default provider<ScriptProcessor<any, any>>({
  lifetime: 'scoped',
  deps: [Base.StateControllerI, ServiceScope, SCRIPT_LIBS_I],
})(ScriptProcessor);
