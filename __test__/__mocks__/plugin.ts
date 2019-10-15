export const mockRegister = jest.fn((appSettings, registeredPlugins) => {
  registeredPlugins.push({
    name: 'Mocked',
    priority: this.priority || 999
  });
  return registeredPlugins;
});
export const mockGetRegisteredStage = jest.fn(() => []);

const Plugin = jest.fn().mockImplementation(() => {
  return {
    getRegisteredStage: mockGetRegisteredStage,
    register: mockRegister
  };
});

export default Plugin as any;
