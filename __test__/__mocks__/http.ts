export const httpServerMock = {
  listen: jest.fn(),
  listeners: jest.fn().mockImplementation(() => []),
  removeAllListeners: jest.fn().mockImplementation(() => ({url: ''})),
  on: jest.fn().mockImplementation((event, callback) => {
    if (event === 'error') {
      return false;
    }

    callback();
  })
};

export const createServer = jest.fn().mockImplementation(() => {
  console.log('Mocking HTTP Server');
  return httpServerMock;
});
