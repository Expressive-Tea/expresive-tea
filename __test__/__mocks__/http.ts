export const httpServerMock = {
  listen: jest.fn().mockImplementation((port, callback) => {
    callback();
  })
};

export const createServer = jest.fn().mockImplementation(() => {
  return httpServerMock;
});
