import { Container } from 'inversify';
import DependencyInjection from '../../../services/DependencyInjection';

describe('Dependency Injection Service', () => {
  let containerBindSpy;
  let containerIsBoundSpy;
  let containerBindToMock;

  class SomeService {
  }

  beforeEach(() => {
    containerBindSpy = jest.spyOn(Container.prototype, 'bind');
    containerIsBoundSpy = jest.spyOn(Container.prototype, 'isBound');

    containerBindToMock = jest.fn();
    containerBindSpy.mockImplementation(() => ({to: containerBindToMock}));
    containerIsBoundSpy.mockImplementation(() => false);
  });

  afterEach(() => {
    containerBindSpy.mockReset();
  });

  test('should setup provider to dependency injection container', () => {
    DependencyInjection.setProvider(SomeService);

    expect(containerBindSpy).toHaveBeenCalledWith('SomeService');
    expect(containerBindToMock).toHaveBeenCalledWith(SomeService);
  });

  test('should setup provider to dependency injection container with name', () => {
    DependencyInjection.setProvider(SomeService, 'OtherProvider');

    expect(containerBindSpy).toHaveBeenCalledWith('OtherProvider');
    expect(containerBindToMock).toHaveBeenCalledWith(SomeService);
  });

  test('should ignore provider if is already on the container', () => {
    containerIsBoundSpy.mockImplementation(() => true);
    DependencyInjection.setProvider(SomeService, 'OtherProvider');

    expect(containerBindSpy).not.toHaveBeenCalledWith('OtherProvider');
  });

});
