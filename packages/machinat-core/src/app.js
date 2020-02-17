// @flow
import invariant from 'invariant';
import ServiceSpace, { isServiceContainer } from './service';
import type {
  Interfaceable,
  InjectRequirement,
  ServiceContainer,
  InjectionScope,
} from './service/types';
import type {
  AppConfig,
  EventContext,
  EventMiddleware,
  DispatchMiddleware,
  EventScopeWrapper,
  DispatchScopeWrapper,
} from './types';

type EventListenable<Context> =
  | (Context => void)
  | ServiceContainer<(Context) => void>;
type ErrorListenable = (Error => void) | ServiceContainer<(Error) => void>;

const ENUM_UNSTARTED = 0;
const ENUM_STARTING = 1;
const ENUM_STARTED = 2;

export default class MachinatApp<
  Context: EventContext<any, any, any, any, any, any>
> {
  config: AppConfig<Context>;
  _status: number;
  _serviceSpace: ServiceSpace;
  _eventListeners: EventListenable<Context>[];
  _errorListeners: ErrorListenable[];

  get isStarted() {
    return this._status === ENUM_STARTED;
  }

  constructor(config: AppConfig<Context>) {
    this.config = config;
    this._status = ENUM_UNSTARTED;

    this._eventListeners = [];
    this._errorListeners = [];
  }

  async start() {
    invariant(
      this._status === ENUM_UNSTARTED,
      `app is ${
        this._status === ENUM_STARTING ? 'starting' : 'already started'
      }`
    );
    this._status = ENUM_STARTING;

    const {
      imports: normalModules,
      platforms: platformModules,
      registers: registeredBindings,
    } = this.config;

    const moduleBindings = [];

    // bootstrap normal modules add bindings
    if (normalModules) {
      const bindingsOfModules = await Promise.all(
        normalModules.map(({ bootstrap }) => bootstrap())
      );
      bindingsOfModules.forEach(bindings => moduleBindings.push(...bindings));
    }

    // add bindings and bridge bindings of platform module
    if (platformModules) {
      const bindingsOfPlatforms = await Promise.all(
        platformModules.map(
          ({
            name: platformName,
            bootstrap,
            eventMiddlewares,
            dispatchMiddlewares,
          }) =>
            bootstrap(
              this._createEventHandlerWrapper(
                platformName,
                eventMiddlewares || []
              ),
              this._createDispatchWrapper(
                platformName,
                dispatchMiddlewares || []
              )
            )
        )
      );

      bindingsOfPlatforms.forEach(bindings => moduleBindings.push(...bindings));
    }

    this._serviceSpace = new ServiceSpace(
      moduleBindings,
      registeredBindings || []
    );

    const startingScope = this._serviceSpace.createScope(undefined);

    // run start hooks of platform modules
    if (platformModules) {
      await Promise.all(
        platformModules.map(({ startHook }) =>
          startHook
            ? startingScope.injectContainer(startHook)
            : Promise.resolve()
        )
      );
    }

    // run start hooks of normal modules
    if (normalModules) {
      await Promise.all(
        normalModules.map(({ startHook }) =>
          startHook
            ? startingScope.injectContainer(startHook)
            : Promise.resolve()
        )
      );
    }

    this._status = ENUM_STARTED;
  }

  use(targets: (Interfaceable | InjectRequirement)[]) {
    invariant(this.isStarted, 'app is not started');

    const scope = this._serviceSpace.createScope();
    return scope.useServices(targets);
  }

  onEvent(listener: EventListenable<Context>) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }

    this._eventListeners.push(listener);
    return this;
  }

  removeEventListener(listener: EventListenable<Context>) {
    const idx = this._eventListeners.findIndex(fn => fn === listener);
    if (idx === -1) {
      return false;
    }

    this._eventListeners.splice(idx, 1);
    return true;
  }

  _emitEvent(scope: InjectionScope, context: Context) {
    for (const listener of this._eventListeners) {
      if (isServiceContainer(listener)) {
        scope.injectContainer(listener)(context);
      } else {
        listener(context);
      }
    }
  }

  onError(listener: ErrorListenable) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }

    this._errorListeners.push(listener);
    return this;
  }

  removeErrorListener(listener: ErrorListenable) {
    const idx = this._errorListeners.findIndex(fn => fn === listener);
    if (idx === -1) {
      return false;
    }

    this._errorListeners.splice(idx, 1);
    return true;
  }

  _emitError(scope: InjectionScope, err: Error) {
    if (this._errorListeners.length === 0) {
      throw err;
    }

    for (const listener of this._errorListeners) {
      if (isServiceContainer(listener)) {
        scope.injectContainer(listener)(err);
      } else {
        listener(err);
      }
    }
  }

  _createEventHandlerWrapper(
    platform: string,
    middlewares: (
      | EventMiddleware<Context, any>
      | ServiceContainer<EventMiddleware<Context, any>>
    )[]
  ): EventScopeWrapper<Context, any> {
    return finalHandler => {
      const handleEvent = (scope: InjectionScope) => async (ctx: Context) => {
        const response = await finalHandler(ctx);
        this._emitEvent(scope, ctx);
        return response;
      };

      if (middlewares.length === 0) {
        return () => {
          const scope = this._serviceSpace.createScope(platform);
          return {
            scope,
            wrappedHandler: handleEvent(scope),
            popError: this._emitError.bind(this, scope),
          };
        };
      }

      const execute = (scope: InjectionScope, idx: number) => async (
        ctx: Context
      ) => {
        let middleware = middlewares[idx];
        if (isServiceContainer(middleware)) {
          middleware = scope.injectContainer(middleware);
        }

        return middleware(
          ctx,
          idx + 1 < middlewares.length
            ? execute(scope, idx + 1)
            : handleEvent(scope)
        );
      };

      return () => {
        const scope = this._serviceSpace.createScope(platform);
        return {
          scope,
          wrappedHandler: execute(scope, 0),
          popError: this._emitError.bind(this, scope),
        };
      };
    };
  }

  _createDispatchWrapper(
    platform: string,
    middlewares: (
      | DispatchMiddleware<any, any, any>
      | ServiceContainer<DispatchMiddleware<any, any, any>>
    )[]
  ): DispatchScopeWrapper<any, any, any> {
    return dispatch => {
      if (middlewares.length === 0) {
        return () => {
          const scope = this._serviceSpace.createScope(platform);
          return {
            scope,
            wrappedDispatcher: dispatch,
          };
        };
      }

      const execute = (scope: InjectionScope, idx: number) => (
        ctx: Context
      ) => {
        let middleware = middlewares[idx];
        if (isServiceContainer(middleware)) {
          middleware = scope.injectContainer(middleware);
        }

        return ((middleware: any): DispatchMiddleware<any, any, any>)(
          ctx,
          idx + 1 < middlewares.length ? execute(scope, idx + 1) : dispatch
        );
      };

      return () => {
        const scope = this._serviceSpace.createScope(platform);
        return {
          scope,
          wrappedDispatcher: execute(scope, 0),
        };
      };
    };
  }
}
