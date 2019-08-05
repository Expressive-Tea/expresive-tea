import { Container } from 'inversify';
import DependencyInjection from '../../../services/DependencyInjection';

describe('Dependency Injection Service', () => {
  class SomeService {
  }

  beforeEach(() => {
    this.containerBindSpy = jest.spyOn(Container.prototype, 'bind');
    this.containerIsBoundSpy = jest.spyOn(Container.prototype, 'isBound');

    this.containerBindToMock = jest.fn();
    this.containerBindSpy.mockImplementation(() => ({to: this.containerBindToMock}));
    this.containerIsBoundSpy.mockImplementation(() => false);
  });

  afterEach(() => {
    this.containerBindSpy.mockReset();
  });

  test('should setup provider to dependency injection container', () => {
    DependencyInjection.setProvider(SomeService);

    expect(this.containerBindSpy).toHaveBeenCalledWith('SomeService');
    expect(this.containerBindToMock).toHaveBeenCalledWith(SomeService);
  });

  test('should setup provider to dependency injection container with name', () => {
    DependencyInjection.setProvider(SomeService, 'OtherProvider');

    expect(this.containerBindSpy).toHaveBeenCalledWith('OtherProvider');
    expect(this.containerBindToMock).toHaveBeenCalledWith(SomeService);
  });

  test('should ignore provider if is already on the container', () => {
    this.containerIsBoundSpy.mockImplementation(() => true);
    DependencyInjection.setProvider(SomeService, 'OtherProvider');

    expect(this.containerBindSpy).not.toHaveBeenCalledWith('OtherProvider');
  });

});
