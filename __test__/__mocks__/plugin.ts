/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */

export const mockRegister = jest.fn(function (appSettings, registeredPlugins) {
  registeredPlugins.push({
    name: 'Mocked',
    priority: 999
  });
  return registeredPlugins;
});
export const mockGetRegisteredStage = jest.fn(() => []);
export let mockPluginArguments: unknown[] = [];

const PluginMock = jest.fn()
  .mockName('Plugin');


const Plugin = PluginMock.mockImplementation(function (...pluginArgs) {
  this.priority = 999;
  mockPluginArguments = pluginArgs;
  return {
    getRegisteredStage: mockGetRegisteredStage,
    register: mockRegister
  };
});

export default Plugin.mockName('XD') as any;
