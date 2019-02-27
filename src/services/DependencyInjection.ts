import { Container } from 'inversify';
import getDecorators from 'inversify-inject-decorators';

class DependencyInjection {

  static getInstance() {
    return !DependencyInjection.instance ? new DependencyInjection() : DependencyInjection.instance;
  }

  private static instance: DependencyInjection;
  private container: Container;
  private lazyDecorators: any;

  constructor() {
    if (DependencyInjection.instance) {
      return DependencyInjection.instance;
    }

    this.container = new Container({
      autoBindInjectable: true
    });

    this.lazyDecorators = getDecorators(this.container);

    DependencyInjection.instance = this;
  }

  getContainer() {
    return this.container;
  }

  getDecorators() {
    return {
      Inject: this.lazyDecorators.lazyInject,
      InjectNamed: this.lazyDecorators.lazyInjectNamed,
      InjectTagged: this.lazyDecorators.lazyInjectTagged,
      MultiInject: this.lazyDecorators.lazyMultiInject
    };
  }
}

export default DependencyInjection;
