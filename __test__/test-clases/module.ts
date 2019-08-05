export const registerMock = jest.fn();
const Module = jest.fn().mockImplementationOnce(() => {
  return { __register: registerMock };
});

export default Module;
