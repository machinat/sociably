import StateControllerI from '@sociably/core/base/StateController';
import type { SociablyThread } from '@sociably/core';
import { ServiceScope, serviceProviderClass } from '@sociably/core/service';
import { SCRIPT_RUNTIME_STATE_KEY } from './constant.js';
import { LibraryAccessorI } from './interface.js';
import ScriptRuntime from './Runtime.js';
import type {
  AnyScriptLibrary,
  CallStatus,
  ScriptRuntimeState,
  ParamsOfScript,
  InputOfScript,
} from './types.js';

type StartRuntimeOptions<Params> = {
  params?: Params;
  goto?: string;
  isPrompting?: boolean;
};

export class ScriptProcessor<
  Script extends AnyScriptLibrary = AnyScriptLibrary
> {
  private _stateContoller: StateControllerI;
  private _serviceScope: ServiceScope;
  private _libAccessor: LibraryAccessorI;

  constructor(
    stateController: StateControllerI,
    scope: ServiceScope,
    libAccessor: LibraryAccessorI
  ) {
    this._stateContoller = stateController;
    this._serviceScope = scope;
    this._libAccessor = libAccessor;
  }

  async start<StartingScript extends Script>(
    thread: SociablyThread,
    script: StartingScript,
    {
      goto,
      params = {} as ParamsOfScript<StartingScript>,
      isPrompting = false,
    }: StartRuntimeOptions<ParamsOfScript<StartingScript>> = {}
  ): Promise<ScriptRuntime<Script>> {
    if (!this._libAccessor.getScript(script.name)) {
      throw new Error(`script ${script.name} is not registered as libs`);
    }

    const state = await this._stateContoller
      .threadState(thread)
      .get<ScriptRuntimeState>(SCRIPT_RUNTIME_STATE_KEY);

    if (state) {
      const scriptName = state.callStack[0].name;
      throw new Error(
        `script [${scriptName}] is already running on thread [${thread.uid}], exit the current runtime before start new one`
      );
    }

    const runtime = new ScriptRuntime<StartingScript>(
      this._stateContoller,
      this._serviceScope,
      thread,
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
    thread: SociablyThread
  ): Promise<null | ScriptRuntime<Script>> {
    const state = await this._stateContoller
      .threadState(thread)
      .get<ScriptRuntimeState>(SCRIPT_RUNTIME_STATE_KEY);

    if (!state) {
      return null;
    }

    const stack: CallStatus<unknown>[] = [];

    for (const { name, vars, stopAt } of state.callStack) {
      const script = this._libAccessor.getScript(name);
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
      thread,
      stack,
      state.timestamp,
      true
    );
  }

  async continue(
    thread: SociablyThread,
    input: InputOfScript<Script>
  ): Promise<null | ScriptRuntime<Script>> {
    const runtime = await this.getRuntime(thread);
    if (!runtime) {
      return null;
    }

    await runtime.run(input);
    return runtime;
  }
}

const ProcessorP = serviceProviderClass({
  lifetime: 'scoped',
  deps: [StateControllerI, ServiceScope, LibraryAccessorI],
})(ScriptProcessor);

type ProcessorP<Script extends AnyScriptLibrary> = ScriptProcessor<Script>;

export default ProcessorP;
