// @flow
export { default } from './space';
export * from './annotate';
export { isServiceContainer, isInterfaceable } from './utils';

/**
 * Machinat DI
 *
 * container:
 *   The containter is the unit to consume the services with IoC style. It is
 *   just a plain function with services claimation annotated, the services
 *   instances will then being injected automatically within the app.
 *
 * provider:
 *   A provider is a factory to porvide service which has its dependencies
 *   annotated for injection. Conventionally the class of the service type is
 *   is used to provide the instance.
 *
 * interfaceable:
 *   An interfaceable is the target you can bind the service provider onto, and
 *   being used to reuqire depenedencies from container. There are three kinds
 *   of interfaceable type can be used:
 *   1. named interfaceable
 *   2. provider class as interfaceable
 *   3. abstract class as interfaceable
 *
 * binding:
 *   The binding binds an interfaceable to a provider or an existed value, all
 *   bindings must be configured before the app start. When a container claims
 *   with the interfaceable, the corresponded service bound to the interfaceable
 *   would be injected into the container.
 *
 * partially binding:
 *   A service can be bound only under specified platforms, and will be provided
 *   only under the scope of platforms bound. The provision for platform would
 *   be provided prioritized to the default one if both provided.
 *
 * service lifetime:
 *   1. "singeleton" services will be created after iniatiation, and will
 *      survive within the life of the app. All claimation of the same token
 *      would retrieve the same instance of singeleton service.
 *   2. "scoped" services will be created when it is claimed by a container
 *      within a scope, and will survive until the scope ends. For example while
 *      rendering, the same token will retrieve the same scoped service instance
 *      whereever the location of the tree is.
 *   3. "transient" services will be created every time it is claimed.
 *
 * phases:
 *   The following steps will be happen in order:
 *   1. app.start()
 *   2. initiation/singeleton services being created
 *   3. singeleton services being cached
 *   4. module.startHook being called
 *   5. startHook of initiation services being called
 *   6. app.start() resolve
 *   7. a scope being requested
 *   8. execute a container under the scope
 *   9. scoped/trasient services being created
 *   10. scoped services being cached
 *   11. inject and run the container
 *   12. repeat from 8. if more container to run
 */
