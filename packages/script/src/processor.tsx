import invariant from 'invariant';
import Machinat from '@machinat/core';
import StateControllerI from '@machinat/core/base/StateController';
import type { MachinatChannel, MachinatNode } from '@machinat/core';
import { ServiceScope, makeClassProvider } from '@machinat/core/service';
import execute from './execute';
import { SCRIPT_STATE_KEY } from './constant';
import { LibraryListI } from './interface';
import { serializeScriptStatus } from './utils';
import type {
  AnyScriptLibrary,
  CallStatus,
  ScriptProcessState,
  ParamsOfScript,
  InputOfScript,
  ReturnOfScript,
  YieldOfScript,
} from './types';

type RuntimeResult<Return, Yield> = {
  finished: boolean;
  returnValue: undefined | Return;
  yieldValue: undefined | Yield;
  contents: MachinatNode;
};

export class ScriptRuntime<Script extends AnyScriptLibrary> {
  channel: MachinatChannel;
  callStack: null | CallStatus<Script>[];
  saveTimestamp: undefined | number;

  private _stateContoller: StateControllerI;
  private _serviceScope: ServiceScope;

  private _requireSaving: boolean;
  private _queuedMessages: MachinatNode[];

  private _returnValue: undefined | ReturnOfScript<Script>;
  private _yieldValue: undefined | YieldOfScript<Script>;

  constructor(
    stateContoller: StateControllerI,
    scope: ServiceScope,
    channel: MachinatChannel,
    stack: CallStatus<Script>[],
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

  get returnValue(): undefined | ReturnOfScript<Script> {
    return this._returnValue;
  }

  get yieldValue(): undefined | YieldOfScript<Script> {
    return this._yieldValue;
  }

  get isBeginning(): boolean {
    return !(this.callStack && (this.saveTimestamp || this._requireSaving));
  }

  get requireSaving(): boolean {
    return this._requireSaving;
  }

  async run(
    input?: InputOfScript<Script>
  ): Promise<RuntimeResult<ReturnOfScript<Script>, YieldOfScript<Script>>> {
    if (!this.callStack) {
      return {
        finished: true,
        returnValue: undefined,
        yieldValue: undefined,
        contents: null,
      };
    }

    const { finished, returnedValue, yieldedValue, stack, contents } =
      await execute(
        this._serviceScope,
        this.channel,
        this.callStack,
        this.isBeginning,
        input
      );

    this.callStack = stack;
    this._returnValue = returnedValue;
    this._yieldValue = yieldedValue;
    this._queuedMessages.push(contents);
    this._requireSaving = true;

    return {
      finished,
      contents,
      returnValue: returnedValue,
      yieldValue: yieldedValue,
    };
  }

  output(): MachinatNode {
    const { callStack, saveTimestamp } = this;
    return (
      <>
        {this._queuedMessages}
        <Machinat.Thunk effect={() => this._save(callStack, saveTimestamp)} />
      </>
    );
  }

  save(): Promise<boolean> {
    const { callStack, saveTimestamp } = this;
    return this._save(callStack, saveTimestamp);
  }

  async _save(
    callStack: null | CallStatus<Script>[],
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

type StartRuntimeOptions<Params> = {
  params?: Params;
  goto?: string;
};

export class ScriptProcessor<Script extends AnyScriptLibrary> {
  private _stateContoller: StateControllerI;
  private _serviceScope: ServiceScope;
  private _libs: Map<string, Script>;

  constructor(
    stateController: StateControllerI,
    scope: ServiceScope,
    scripts: Script[]
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

  async start<StartingScript extends Script>(
    channel: MachinatChannel,
    script: StartingScript,
    options: StartRuntimeOptions<ParamsOfScript<StartingScript>> = {} as any
  ): Promise<ScriptRuntime<Script>> {
    const { params = {} as ParamsOfScript<Script>, goto } = options;

    if (this._libs.get(script.name) !== script) {
      throw new Error(`script ${script.name} is not registered as libs`);
    }

    const state = await this._stateContoller
      .channelState(channel)
      .get<ScriptProcessState>(SCRIPT_STATE_KEY);

    if (state) {
      const scriptName = state.callStack[0].name;
      throw new Error(
        `script [${scriptName}] is already running on channel [${channel.uid}], exit the current runtime before start new one`
      );
    }

    const runtime = new ScriptRuntime(
      this._stateContoller,
      this._serviceScope,
      channel,
      [
        {
          script,
          vars: script.initVars(params),
          stopAt: goto,
        } as CallStatus<StartingScript>,
      ]
    );

    await runtime.run();
    return runtime;
  }

  async getRuntime(
    channel: MachinatChannel
  ): Promise<null | ScriptRuntime<Script>> {
    const state = await this._stateContoller
      .channelState(channel)
      .get<ScriptProcessState>(SCRIPT_STATE_KEY);

    if (!state) {
      return null;
    }

    const statusStack: CallStatus<Script>[] = [];

    for (const { name, vars, stopAt } of state.callStack) {
      const script = this._libs.get(name);
      if (!script) {
        throw new Error(
          `script ${name} is not registered, the linked libs might have been changed`
        );
      }

      statusStack.push({ script, vars, stopAt } as CallStatus<Script>);
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
    input: InputOfScript<Script>
  ): Promise<null | ScriptRuntime<Script>> {
    const runtime = await this.getRuntime(channel);
    if (!runtime) {
      return null;
    }

    await runtime.run(input);
    return runtime;
  }
}

const ProcessorP = makeClassProvider({
  lifetime: 'scoped',
  deps: [StateControllerI, ServiceScope, LibraryListI] as const,
})(ScriptProcessor);

type ProcessorP<Script extends AnyScriptLibrary> = ScriptProcessor<Script>;

export default ProcessorP;
