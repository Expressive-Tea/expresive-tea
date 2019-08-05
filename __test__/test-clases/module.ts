export const registerMock = jest.fn();
export default function Module() {}

Module.prototype.__register = registerMock;
