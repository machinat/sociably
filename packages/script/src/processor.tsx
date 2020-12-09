import invariant from 'invariant';
import Machinat from '@machinat/core';
import Base from '@machinat/core/base';
import { ServiceScope, makeClassProvider } from '@machinat/core/service';
import type {
  MachinatChannel,
  MachinatNode,
  ThunkElement,
} from '@machinat/core/types';
import execute from './execute';
import { SCRIPT_STATE_KEY, SCRIPT_LIBS_I } from './constant';
import { serializeScriptStatus } from './utils';
import type { MachinatScript, CallStatus, ScriptProcessState } from './types';

type RuntimeResult<ReturnValue> = {
  finished: boolean;
  returnValue: undefined | ReturnValue;
  content: MachinatNode;
};

export class ScriptRuntime<Input, ReturnValue> {
  channel: MachinatChannel;
  callStack: null | CallStatus<any, Input, ReturnValue>[];
  saveTimestamp: undefined | number;

  private _stateContoller: Base.StateControllerI;
  private _serviceScope: ServiceScope;

  private _requireSaving: boolean;
  private _queuedMessages: MachinatNode[];
  private _returnValue: undefined | ReturnValue;

  constructor(
    stateContoller: Base.StateControllerI,
    scope: ServiceScope,
    channel: MachinatChannel,
    stack: CallStatus<any, Input, ReturnValue>[],
    promptTimestamp?: number
  ) {
    this.channel = channel;
    this.callStack = stack;
    this.saveTimestamp = promptTimestamp;

    this._stateContoller = stateContoller;
    this._serviceScope = scope;
    this._queuedMessages = [];
    this._requireSaving = false;
  }

  get isFinished(): boolean {
    return !this.callStack;
  }

  get returnValue(): undefined | ReturnValue {
    return this._returnValue;
  }

  get isPrompting(): boolean {
    return !!(this.callStack && (this.saveTimestamp || this._requireSaving));
  }

  get requireSaving(): boolean {
    return this._requireSaving;
  }

  async run(input?: Input): Promise<RuntimeResult<ReturnValue>> {
    if (!this.callStack) {
      return {
        finished: true,
        returnValue: undefined,
        content: null,
      };
    }

    const { finished, returnValue, stack, content } = await execute(
      this._serviceScope,
      this.channel,
      this.callStack,
      this.isPrompting,
      input
    );

    this.callStack = stack;
    this._returnValue = returnValue;
    this._queuedMessages.push(content);
    this._requireSaving = true;

    return {
      finished,
      returnValue,
      content,
    };
  }

  output(): [MachinatNode, ThunkElement] {
    const { callStack, saveTimestamp } = this;
    return [
      [...this._queuedMessages],
      // @ts-expect-error: allow symbol type, follow microsoft/TypeScript/issues/38367
      <Machinat.Thunk effect={() => this._save(callStack, saveTimestamp)} />,
    ];
  }

  save(): Promise<boolean> {
    const { callStack, saveTimestamp } = this;
    return this._save(callStack, saveTimestamp);
  }

  async _save(
    callStack: null | CallStatus<any, Input, ReturnValue>[],
    saveTimestamp: undefined | number
  ): Promise<boolean> {
    if (!callStack && !saveTimestamp) {
      return false;
    }

    const timestamp = Date.now();
    await this._stateContoller
      .channelState(this.channel)
      .update<ScriptProcessState>(SCRIPT_STATE_KEY, (lastState) => {
        if (
          saveTimestamp
            ? !lastState || lastState.timestamp !== saveTimestamp
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

    this.saveTimestamp = timestamp;
    this._queuedMessages = [];
    this._requireSaving = false;
    return true;
  }

  async exit(): Promise<boolean> {
    const isDeleted = await this._stateContoller
      .channelState(this.channel)
      .delete(SCRIPT_STATE_KEY);
    return isDeleted;
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
    stateController: Base.StateControllerI,
    scope: ServiceScope,
    scripts: MachinatScript<any, Input, ReturnValue, any>[]
  ) {
    this._stateContoller = stateController;
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

  async start<Vars>(
    channel: MachinatChannel,
    script: MachinatScript<Vars, Input, ReturnValue, any>,
    { vars = {} as Vars, goto }: InitRuntimeOptions<Vars> = {}
  ): Promise<ScriptRuntime<Input, ReturnValue>> {
    if (this._libs.get(script.name) !== script) {
      throw new Error(`script ${script.name} is not registered as libs`);
    }

    const state = await this._stateContoller
      .channelState(channel)
      .get<ScriptProcessState>(SCRIPT_STATE_KEY);

    if (state) {
      throw new Error(
        'there is already script processing on the channel, exit the current runtime before init new one'
      );
    }

    const runtime = new ScriptRuntime(
      this._stateContoller,
      this._serviceScope,
      channel,
      [{ script, vars, stopAt: goto }]
    );

    await runtime.run();
    return runtime;
  }

  async getRuntime(
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
      if (!script) {
        throw new Error(
          `script ${name} is not registered, the linked libs might have been changed`
        );
      }

      statusStack.push({ script, vars, stopAt });
    }

    return new ScriptRuntime(
      this._stateContoller,
      this._serviceScope,
      channel,
      statusStack,
      state.timestamp
    );
  }

  async continue(
    channel: MachinatChannel,
    input: Input
  ): Promise<null | ScriptRuntime<Input, ReturnValue>> {
    const runtime = await this.getRuntime(channel);
    if (!runtime) {
      return null;
    }

    await runtime.run(input);
    return runtime;
  }
}

export const ProcessorP = makeClassProvider({
  lifetime: 'scoped',
  deps: [Base.StateControllerI, ServiceScope, SCRIPT_LIBS_I] as const,
})(ScriptProcessor);

export type ProcessorP<Input, ReturnValue> = ScriptProcessor<
  Input,
  ReturnValue
>;
