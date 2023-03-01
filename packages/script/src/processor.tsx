import invariant from 'invariant';
import Sociably from '@sociably/core';
import StateControllerI from '@sociably/core/base/StateController';
import type { SociablyChannel, SociablyNode } from '@sociably/core';
import { ServiceScope, makeClassProvider } from '@sociably/core/service';
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
  MetaOfScript,
} from './types';

type RuntimeResult<Return, Yield> = {
  finished: boolean;
  returnValue: undefined | Return;
  yieldValue: undefined | Yield;
  contents: SociablyNode;
};

export class ScriptRuntime<Script extends AnyScriptLibrary> {
  channel: SociablyChannel;
  callStack: null | CallStatus<unknown>[];
  saveTimestamp: undefined | number;
  rootScript: Script;

  private _stateContoller: StateControllerI;
  private _serviceScope: ServiceScope;

  private _requireSaving: boolean;
  private _isPrompting: boolean;
  private _queuedMessages: SociablyNode[];

  private _returnValue: undefined | ReturnOfScript<Script>;
  private _yieldValue: undefined | YieldOfScript<Script>;

  constructor(
    stateContoller: StateControllerI,
    scope: ServiceScope,
    channel: SociablyChannel,
    stack: CallStatus<unknown>[],
    promptTimestamp: undefined | number,
    isPrompting: boolean
  ) {
    this.channel = channel;
    this.callStack = stack;
    this.saveTimestamp = promptTimestamp;
    this._isPrompting = isPrompting;
    this.rootScript = stack[0].script as Script;

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
    return !this.saveTimestamp && !this._requireSaving;
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

    const { finished, returnedValue, yieldedValue, callStack, contents } =
      await execute<
        InputOfScript<Script>,
        ReturnOfScript<Script>,
        YieldOfScript<Script>,
        MetaOfScript<Script>
      >(
        this._serviceScope,
        this.channel,
        this.callStack,
        this._isPrompting,
        input
      );

    this.callStack = callStack;
    this._returnValue = returnedValue;
    this._yieldValue = yieldedValue;
    this._queuedMessages.push(contents);
    this._requireSaving = true;
    this._isPrompting = !!callStack;

    return {
      finished,
      contents,
      returnValue: returnedValue,
      yieldValue: yieldedValue,
    };
  }

  resetCallStack(
    callStack: CallStatus<unknown>[],
    { isPrompting = false }: { isPrompting?: boolean } = {}
  ): void {
    this.callStack = callStack;
    this._isPrompting = isPrompting;
    this._requireSaving = true;
  }

  output(): SociablyNode {
    const { callStack, saveTimestamp } = this;
    return (
      <>
        {this._queuedMessages}
        <Sociably.Thunk effect={() => this._save(callStack, saveTimestamp)} />
      </>
    );
  }

  save(): Promise<boolean> {
    const { callStack, saveTimestamp } = this;
    return this._save(callStack, saveTimestamp);
  }

  async _save(
    callStack: null | CallStatus<unknown>[],
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
              version: '0',
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
  isPrompting?: boolean;
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
    channel: SociablyChannel,
    script: StartingScript,
    {
      goto,
      params = {} as ParamsOfScript<StartingScript>,
      isPrompting = false,
    }: StartRuntimeOptions<ParamsOfScript<StartingScript>> = {}
  ): Promise<ScriptRuntime<Script>> {
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

    const runtime = new ScriptRuntime<StartingScript>(
      this._stateContoller,
      this._serviceScope,
      channel,
      [
        {
          script,
          vars: script.initVars(params),
          stopAt: goto,
        } as CallStatus<StartingScript>,
      ],
      undefined,
      isPrompting
    );

    await runtime.run();
    return runtime;
  }

  async getRuntime(
    channel: SociablyChannel
  ): Promise<null | ScriptRuntime<Script>> {
    const state = await this._stateContoller
      .channelState(channel)
      .get<ScriptProcessState>(SCRIPT_STATE_KEY);

    if (!state) {
      return null;
    }

    const stack: CallStatus<unknown>[] = [];

    for (const { name, vars, stopAt } of state.callStack) {
      const script = this._libs.get(name);
      if (!script) {
        throw new Error(
          `script ${name} is not registered, the linked libs might have been changed`
        );
      }

      stack.push({ script, vars, stopAt } as CallStatus<unknown>);
    }

    return new ScriptRuntime(
      this._stateContoller,
      this._serviceScope,
      channel,
      stack,
      state.timestamp,
      true
    );
  }

  async continue(
    channel: SociablyChannel,
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
  deps: [StateControllerI, ServiceScope, LibraryListI],
})(ScriptProcessor);

type ProcessorP<Script extends AnyScriptLibrary> = ScriptProcessor<Script>;

export default ProcessorP;
