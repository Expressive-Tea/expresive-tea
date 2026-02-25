import { Container, Newable, ServiceIdentifier } from 'inversify';
import parentContainer from '../inversify.config';
import getDecorators from 'inversify-inject-decorators';
import { LazyInversifyDecorator, LazyInversifyNamedDecorator, LazyInversifyTaggedDecorator } from '../types/inversify';

interface InversifyDecorators {
  lazyInject: LazyInversifyDecorator;
  lazyInjectNamed: LazyInversifyNamedDecorator;
  lazyInjectTagged: LazyInversifyTaggedDecorator;
  lazyMultiInject: LazyInversifyDecorator;
}

const rootContainer: Container = new Container({
  autobind: true,
  parent: parentContainer
});

const lazyDecorators: InversifyDecorators = getDecorators(rootContainer);

/**
 * @module Services
 */
/**
 * This Class contain the helpers to add on the dynamically Dependency Injection Providers which will be used globally
 * by all the components.
 * @class DependencyInjection
 * @summary Define a Dependency Injection Provider
 */
class DependencyInjection {
  /**
   * This is the implementation of a global inversify container that helps to contains every Dependency Injection.
   * @type {InversifyContainers}
   * @static
   * @readonly
   * @summary Inversify Container
   */
  static readonly Container: Container = rootContainer;

  /**
   * Map of scoped containers for module-level isolation.
   * @type {Map<string, Container>}
   * @private
   * @static
   * @since 2.0.0
   */
  private static scopedContainers: Map<string, Container> = new Map();

  /**
   * This assign to the global inversify container Express Tea can set provider as user required to the global container
   * and shareable to all registered modules. This method is used if required to assign a provider depending on params
   * or data flow.
   *
   * @param {Class} ProviderFactory - Assign the Class to serve as factory.
   * @param {string | symbol} [providerName="ClassName"] - Provide the provider identification.
   * @summary Add Provider to Dependency Injection Providers
   */

  static setProvider(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ProviderFactory: Newable<any>,
    providerName?: ServiceIdentifier<string | symbol>
  ): void {
    if (!rootContainer.isBound(providerName ?? ProviderFactory.name)) {
      rootContainer.bind(providerName ?? ProviderFactory.name).to(ProviderFactory);
    }
  }

  /**
   * Create a new scoped container for module-level dependency isolation.
   * The scoped container inherits from the root container but maintains its own bindings.
   *
   * @param {string} scopeName - Unique identifier for the scope
   * @returns {Container} The newly created scoped container
   * @throws {Error} If a scope with the same name already exists
   * @static
   * @since 2.0.0
   * @summary Create a scoped DI container
   *
   * @example
   * const moduleScope = DependencyInjection.createScope('user-module');
   * moduleScope.bind(UserService).toSelf();
   */
  static createScope(scopeName: string): Container {
    if (DependencyInjection.scopedContainers.has(scopeName)) {
      throw new Error(`Scope "${scopeName}" already exists`);
    }

    const scopedContainer = new Container({ parent: rootContainer });
    DependencyInjection.scopedContainers.set(scopeName, scopedContainer);

    return scopedContainer;
  }

  /**
   * Retrieve an existing scoped container by name.
   *
   * @param {string} scopeName - Unique identifier for the scope
   * @returns {Container | undefined} The scoped container, or undefined if not found
   * @static
   * @since 2.0.0
   * @summary Get a scoped DI container
   *
   * @example
   * const moduleScope = DependencyInjection.getScope('user-module');
   * if (moduleScope) {
   *   const service = moduleScope.get(UserService);
   * }
   */
  static getScope(scopeName: string): Container | undefined {
    return DependencyInjection.scopedContainers.get(scopeName);
  }

  /**
   * Destroy a scoped container and remove it from the registry.
   * This unbinds all services within the scope and cleans up resources.
   *
   * @param {string} scopeName - Unique identifier for the scope
   * @returns {boolean} True if the scope was found and destroyed, false otherwise
   * @static
   * @since 2.0.0
   * @summary Destroy a scoped DI container
   *
   * @example
   * const destroyed = DependencyInjection.destroyScope('user-module');
   * if (destroyed) {
   *   console.log('Scope destroyed successfully');
   * }
   */
  static destroyScope(scopeName: string): boolean {
    const scopedContainer = DependencyInjection.scopedContainers.get(scopeName);
    if (scopedContainer) {
      scopedContainer.unbindAll();
      DependencyInjection.scopedContainers.delete(scopeName);
      return true;
    }
    return false;
  }

  /**
   * Get all registered scope names.
   *
   * @returns {string[]} Array of scope names
   * @static
   * @since 2.0.0
   * @summary Get all scope names
   *
   * @example
   * const scopes = DependencyInjection.getAllScopeNames();
   * console.log('Active scopes:', scopes);
   */
  static getAllScopeNames(): string[] {
    return Array.from(DependencyInjection.scopedContainers.keys());
  }

  /**
   * Check if a scope exists.
   *
   * @param {string} scopeName - Unique identifier for the scope
   * @returns {boolean} True if the scope exists, false otherwise
   * @static
   * @since 2.0.0
   * @summary Check if scope exists
   *
   * @example
   * if (DependencyInjection.hasScope('user-module')) {
   *   console.log('Scope exists');
   * }
   */
  static hasScope(scopeName: string): boolean {
    return DependencyInjection.scopedContainers.has(scopeName);
  }
}

/**
 * @module Decorators/DependencyInjection
 */

/**
 * This annotation allow inject directly into a class property an instance of the provider as is passed on the
 * provider declaration, checkout
 * {@link https://github.com/inversify/InversifyJS/blob/master/wiki/classes_as_id.md Classes as ID}
 * from Inversify Project.
 * @decorator {PropertyDecorator} Inject - Inject a dependency constructor defined as provider.
 * @summary Inject a instance of provider defined as Dependency Injection.
 * @function
 */
export const Inject = lazyDecorators.lazyInject;

/**
 * This implement the Tagged Bindings from Inversify to used on the contructors arguments of the injectable classes and
 * allow not create ambiguous match as named annotation, also check out
 * {@link https://github.com/inversify/InversifyJS/blob/master/wiki/named_bindings.md Named Bindings}
 * from Inversify Project.
 * @decorator {ConstructorParameter} InjectNamed - Inject a provider instance on costructor arguments.
 * @summary Bind provider as named annotation.
 * @function
 */
export const InjectNamed = lazyDecorators.lazyInjectNamed;

/**
 * This implement the Named Bindings from Inversify to used on the contructors arguments of the injectable classes and
 * allow not create ambiguous match as tagged annotation.
 * {@link https://github.com/inversify/InversifyJS/blob/master/wiki/tagged_bindings.md Tagged Bindings}
 * @decorator {ConstructorParameter} InjectTagged - Inject a provider instance on costructor arguments.
 * @summary Bind provider as tagged annotation.
 * @function
 */
export const InjectTagged = lazyDecorators.lazyInjectTagged;

/**
 * Bind an array of bind providers  with the same name over the constructor parameter.
 * {@link https://github.com/inversify/InversifyJS/blob/master/wiki/multi_injection.md Multiple Injection}
 * @decorator {ConstructorParameter} MultiInject - Inject an array of providers under same name.
 * @summary Define multiple concretions for defined inject.
 * @function
 */
export const MultiInject = lazyDecorators.lazyMultiInject;

export function defineConstant<T>(name: string | symbol, value: T): void {
  DependencyInjection.Container.bind<T>(name).toConstantValue(value);
}

export function getInstanceOf<T>(Target: Newable<T>): T {
  return DependencyInjection.Container.get<T>(Target);
}

export default DependencyInjection;
