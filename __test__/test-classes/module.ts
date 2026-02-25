import { vi } from 'vitest';

export const registerMock = vi.fn();

export default function Module() {}

Module.prototype.__register = registerMock;
