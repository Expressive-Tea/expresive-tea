export const httpServerMock: any = {
  listen: jest.fn().mockImplementation((_port?: number) => {}),
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
  return httpServerMock;
});
