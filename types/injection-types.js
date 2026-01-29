"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TYPES = void 0;
// Service identifiers for dependency injection
exports.TYPES = {
    Context: Symbol.for('Context'),
    Server: Symbol.for('Server'),
    SecureServer: Symbol.for('SecureServer'),
    Settings: Symbol.for('Settings')
};
