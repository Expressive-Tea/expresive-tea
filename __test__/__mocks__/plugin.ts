// tslint:disable-next-line:only-arrow-functions
export const mockRegister = jest.fn(function (appSettings, registeredPlugins) {
  registeredPlugins.push({
    name: 'Mocked',
    priority: 999
  });
  return registeredPlugins;
});
export const mockGetRegisteredStage = jest.fn(() => []);

// tslint:disable-next-line:only-arrow-functions
const Plugin = jest.fn().mockImplementation(function () {
  this.priority = 999;
  return {
    getRegisteredStage: mockGetRegisteredStage,
    register: mockRegister
  };
});

export default Plugin as any;
