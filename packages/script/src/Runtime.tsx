import Sociably from '@sociably/core';
import StateControllerI from '@sociably/core/base/StateController';
import type { SociablyThread, SociablyNode } from '@sociably/core';
import { ServiceScope } from '@sociably/core/service';
import execute from './execute.js';
import { SCRIPT_RUNTIME_STATE_KEY } from './constant.js';
import { serializeScriptStatus } from './utils.js';
import type {
  AnyScriptLibrary,
  CallStatus,
  ScriptRuntimeState,
  InputOfScript,
  ReturnOfScript,
  YieldOfScript,
  MetaOfScript,
} from './types.js';

type RuntimeResult<Return, Yield> = {
  finished: boolean;
  returnValue: undefined | Return;
  yieldValue: undefined | Yield;
  contents: SociablyNode;
};

export class ScriptRuntime<Script extends AnyScriptLibrary> {
  thread: SociablyThread;
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
    thread: SociablyThread,
    stack: CallStatus<unknown>[],
    promptTimestamp: undefined | number,
    isPrompting: boolean,
  ) {
    this.thread = thread;
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
    input?: InputOfScript<Script>,
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
        this.thread,
        this.callStack,
        this._isPrompting,
        input,
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
    { isPrompting = false }: { isPrompting?: boolean } = {},
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
    saveTimestamp: undefined | number,
  ): Promise<boolean> {
    if (!callStack && !saveTimestamp) {
      return false;
    }

    const timestamp = Date.now();
    await this._stateContoller
      .threadState(this.thread)
      .update<ScriptRuntimeState>(SCRIPT_RUNTIME_STATE_KEY, (lastState) => {
        if (
          saveTimestamp
            ? !lastState || lastState.timestamp !== saveTimestamp
            : lastState
        ) {
          throw new Error(
            'runtime state have changed while execution, there are maybe ' +
              'mutiple runtimes of the same thread executing at the same time',
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
      .threadState(this.thread)
      .delete(SCRIPT_RUNTIME_STATE_KEY);
    return isDeleted;
  }
}

export default ScriptRuntime;
