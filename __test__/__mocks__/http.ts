/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call */

export const httpServerMock: any = {
  listen: jest.fn(),
  listeners: jest.fn().mockImplementation(() => []),
  removeAllListeners: jest.fn().mockImplementation(() => ({ url: '' })),
  close: jest.fn().mockImplementation((callback?: () => void) => {
    if (callback) {
      callback();
    }
  }),
  on: jest.fn().mockImplementation((event, callback) => {
    if (event === 'error') {
      return false;
    }

    callback();
  })
};

export const createServer = jest.fn().mockImplementation(() => {
  // keep a lightweight console for debugging test runs
   
  console.log('Mocking HTTP Server');
  return httpServerMock;
});
