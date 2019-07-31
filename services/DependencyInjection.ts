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

class DependencyInjection {
  static readonly Container: Container = rootContainer;

  static setProvider(ProviderFactory): void;
  static setProvider(ProviderFactory: any, providerName?: string | symbol): void {
    if (!rootContainer.isBound(providerName || ProviderFactory.name)) {
      rootContainer.bind(providerName || ProviderFactory.name).to(ProviderFactory);
    }
  }
}

export const Inject = lazyDecorators.lazyInject;
export const InjectNamed = lazyDecorators.lazyInjectNamed;
export const InjectTagged = lazyDecorators.lazyInjectTagged;
export const MultiInject = lazyDecorators.lazyMultiInject;
export default DependencyInjection;
