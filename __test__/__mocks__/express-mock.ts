
const expressMock = () => {
  return {
    listen: jest.fn().mockImplementation((port, cb) => {
      setTimeout(() => cb(), 200);
      return { port };
    }),
    use: jest.fn()
  };
};

expressMock.static = jest.fn();

export default expressMock;
