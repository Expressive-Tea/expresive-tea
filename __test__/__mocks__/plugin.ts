// tslint:disable-next-line:only-arrow-functions
export const mockRegister = jest.fn(function (appSettings, registeredPlugins) {
  registeredPlugins.push({
    name: 'Mocked',
    priority: 999
  });
  return registeredPlugins;
});
export const mockGetRegisteredStage = jest.fn(() => []);
export let mockPluginArguments = [];

// tslint:disable-next-line:only-arrow-functions
const Plugin = jest.fn().mockImplementation(function (...pluginArgs) {
  this.priority = 999;
  mockPluginArguments = pluginArgs;
  return {
    getRegisteredStage: mockGetRegisteredStage,
    register: mockRegister
  };
});

export default Plugin as any;
