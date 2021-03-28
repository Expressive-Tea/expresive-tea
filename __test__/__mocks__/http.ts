export const httpServerMock = {
  listen: jest.fn(),
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
