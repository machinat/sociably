export { default as ServiceSpace } from './space.js';
export { default as ServiceScope } from './scope.js';
export { default as serviceProviderClass } from './decorators/serviceProviderClass.js';
export { default as serviceProviderFactory } from './decorators/serviceProviderFactory.js';
export { default as serviceContainer } from './decorators/serviceContainer.js';
export { default as serviceInterface } from './decorators/serviceInterface.js';
export {
  isServiceContainer,
  isServiceProvider,
  isInterfaceable,
  createEmptyScope,
  maybeInjectContainer,
} from './utils.js';
export * from './types.js';

/**
 * Sociably DI
 *
 * Container: The containter is the unit to consume the services with IoC style.
 * It is just a plain function with services claimation annotated, the services
 * instances will then being injected automatically within the app.
 *
 * Provider: A provider is a factory to porvide service which has its
 * dependencies annotated for injection. Conventionally the class of the service
 * type is is used to provide the instance.
 *
 * Interfaceable: An interfaceable is the target you can bind the service
 * provider onto, and being used to reuqire depenedencies from container. There
 * are three kinds of interfaceable type can be used:
 *
 * 1. Named interfaceable
 * 2. Provider class as interfaceable
 * 3. Abstract class as interfaceable
 *
 * Service: A service binds an interface to a provider or an existed value, all
 * bindings must be configured before the app start. When a container claims
 * with the interfaceable, the corresponded service bound to the interfaceable
 * would be injected into the container.
 *
 * Service lifetime:
 *
 * 1. "singeleton" services would be created after iniatiation, and would survive
 *    within the life of the app. All claimation of the same token would
 *    retrieve the same instance of singeleton service.
 * 2. "scoped" services would be created when it is claimed by a container within a
 *    scope, and would survive until the scope ends. For example while rendering
 *    message, the same instance of scoped provider would be retrieved whereever
 *    the location of the tree is.
 * 3. "transient" services would be created every time it is claimed.
 *
 * Phases: The following steps will be happen in order:
 *
 * 1. App.start()
 * 2. Initiation/singeleton services being created
 * 3. Singeleton services being cached
 * 4. Module.startHook being called
 * 5. StartHook of initiation services being called
 * 6. App.start() resolve
 * 7. A scope being requested
 * 8. Execute a container under the scope
 * 9. Scoped/trasient services being created
 * 10. Scoped services being cached
 * 11. Inject and run the container
 * 12. Repeat from 8. if more container to run
 */
