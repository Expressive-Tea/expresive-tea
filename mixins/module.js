"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modulize = Modulize;
const tslib_1 = require("tslib");
const express_1 = require("express");
const DependencyInjection_1 = require("../services/DependencyInjection");
const inversify_1 = require("inversify");
/**
 * Modulize mixin - Adds Expressive Tea module capabilities to a class
 *
 * Transforms a regular class into an Expressive Tea module with:
 * - Dependency injection support
 * - Express router management
 * - Controller instantiation and registration
 * - Module mounting capabilities
 *
 * @template TBase - The base constructor type to extend
 * @param {TBase} Base - The base class to extend
 * @param {ExpressiveTeaModuleProps} options - Module configuration options
 * @returns {ModulizedClass<TBase>} The enhanced class with module capabilities
 *
 * @example
 * ```typescript
 * class MyModule {}
 * const ModulizedMyModule = Modulize(MyModule, {
 *   mountpoint: '/api',
 *   controllers: [UserController],
 *   providers: [UserService]
 * });
 * ```
 * @since 2.0.0
 */
function Modulize(Base, options) {
    let ExpressiveTeaModule = class ExpressiveTeaModule extends Base {
        constructor(...args) {
            var _a;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            super(...args);
            this.settings = options;
            this.router = (0, express_1.Router)();
            for (const Provider of (_a = options.providers) !== null && _a !== void 0 ? _a : []) {
                DependencyInjection_1.default.setProvider(Provider);
            }
            this.controllers = options.controllers.map((C) => (0, DependencyInjection_1.getInstanceOf)(C));
        }
        __register(server) {
            for (const controller of this.controllers) {
                controller.__mount(this.router);
            }
            server.use(this.settings.mountpoint, this.router);
        }
    };
    ExpressiveTeaModule = tslib_1.__decorate([
        (0, inversify_1.injectable)('Singleton'),
        (0, inversify_1.injectFromBase)({ extendConstructorArguments: true }),
        tslib_1.__metadata("design:paramtypes", [Object])
    ], ExpressiveTeaModule);
    return ExpressiveTeaModule;
}
