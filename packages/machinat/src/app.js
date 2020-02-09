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

const ENUM_NON_STARTED = 0;
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
    this._serviceSpace = new ServiceSpace();
    this._status = ENUM_NON_STARTED;
  }

  async start() {
    invariant(
      this._status === ENUM_NON_STARTED,
      this._status === ENUM_STARTING
        ? 'app is starting'
        : 'app is already started'
    );
    this._status = ENUM_STARTING;

    // add user registered bindings
    if (this.config.bindings) {
      this._serviceSpace.addRegisteredBindings(this.config.bindings);
    }

    // add bindings of each normal module import
    if (this.config.imports) {
      for (const { bindings } of this.config.imports) {
        this._serviceSpace.addModuleBindings(bindings);
      }
    }

    // add bindings and bridge bindings of platform module
    if (this.config.platforms) {
      for (const platformModule of this.config.platforms) {
        const {
          name: platformName,
          init,
          eventMiddlewares,
          dispatchMiddlewares,
        } = platformModule;

        const eventWrapper = this._createEventHandlerWrapper(
          platformName,
          eventMiddlewares || []
        );

        const dispatchWrapper = this._createDispatchWrapper(
          platformName,
          dispatchMiddlewares || []
        );

        const bindings = init(eventWrapper, dispatchWrapper);
        this._serviceSpace.addModuleBindings(bindings);
      }
    }

    await this._serviceSpace.init();
    const startingScope = await this._serviceSpace.createScope(undefined);

    // run start hooks of platform modules
    if (this.config.platforms) {
      const platformStartingPromises = [];

      for (const { startHook } of this.config.platforms) {
        if (startHook) {
          platformStartingPromises.push(
            startingScope.executeContainer(startHook)
          );
        }
      }

      await Promise.all(platformStartingPromises);
    }

    // run start hooks of normal modules
    if (this.config.imports) {
      const moduleStartingPromises = [];

      for (const { startHook } of this.config.imports) {
        if (startHook) {
          moduleStartingPromises.push(
            startingScope.executeContainer(startHook)
          );
        }
      }

      await Promise.all(moduleStartingPromises);
    }

    this._status = ENUM_STARTED;
  }

  async use(targets: (Interfaceable | InjectRequirement)[]) {
    invariant(this.isStarted, 'app is not started');

    const scope = await this._serviceSpace.createScope();
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
        scope
          .executeContainer(listener)
          .then(containedListener => {
            containedListener(context);
          })
          .catch(this._emitError.bind(this, scope));
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
        scope.executeContainer(listener).then(containedListener => {
          containedListener(err);
        });
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
        return async () => {
          const scope = await this._serviceSpace.createScope(platform);
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
          middleware = await scope.executeContainer(middleware);
        }

        return middleware(
          ctx,
          idx + 1 < middlewares.length
            ? execute(scope, idx + 1)
            : handleEvent(scope)
        );
      };

      return async () => {
        const scope = await this._serviceSpace.createScope(platform);
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
        return async () => {
          const scope = await this._serviceSpace.createScope(platform);
          return { scope, wrappedDispatcher: dispatch };
        };
      }

      const execute = (scope: InjectionScope, idx: number) => async (
        ctx: Context
      ) => {
        let middleware = middlewares[idx];
        if (isServiceContainer(middleware)) {
          middleware = await scope.executeContainer(middleware);
        }

        return ((middleware: any): DispatchMiddleware<any, any, any>)(
          ctx,
          idx + 1 < middlewares.length ? execute(scope, idx + 1) : dispatch
        );
      };

      return async () => {
        const scope = await this._serviceSpace.createScope(platform);
        return {
          scope,
          wrappedDispatcher: execute(scope, 0),
        };
      };
    };
  }
}
