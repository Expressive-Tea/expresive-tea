import { Container } from 'inversify';
import getDecorators from 'inversify-inject-decorators';

interface InversifyDecorators {
  lazyInject(...args: any[]);

  lazyInjectNamed(...args: any[]);

  lazyInjectTagged(...args: any[]);

  lazyMultiInject(...args: any[]);
}

const rootContainer: Container = new Container({
  autoBindInjectable: true
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
   * This assign to the global inversify container Express Tea can set provider as user required to the global container
   * and shareable to all registered modules. This method is used if required to assign a provider depending on params
   * or data flow.
   *
   * @param {Class} ProviderFactory - Assign the Class to serve as factory.
   * @param {string | symbol |never } [providerName="ClassName"] - Provide the provider identification.
   * @summary Add Provider to Dependency Injection Providers
   */
  static setProvider(ProviderFactory: any, providerName?: string | symbol): void {
    if (!rootContainer.isBound(providerName || ProviderFactory.name)) {
      rootContainer.bind(providerName || ProviderFactory.name).to(ProviderFactory);
    }
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

export default DependencyInjection;
