"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Routerize = Routerize;
const tslib_1 = require("tslib");
const express_1 = require("express");
const Metadata_1 = require("@expressive-tea/commons/classes/Metadata");
const constants_1 = require("@expressive-tea/commons/constants");
const server_1 = require("../helpers/server");
const inversify_1 = require("inversify");
/**
 * Routerize mixin - Adds Expressive Tea route capabilities to a controller class
 *
 * Transforms a regular class into an Expressive Tea route controller with:
 * - Express router management
 * - Route handler registration
 * - Middleware support
 * - Automatic argument injection from decorators
 * - Annotation processing
 *
 * @template TBase - The base constructor type to extend
 * @param {TBase} Route - The base controller class to extend
 * @param {string} mountpoint - The path where this controller should be mounted
 * @returns {RouterizedClass<TBase>} The enhanced class with route capabilities
 *
 * @example
 * ```typescript
 * @Route('/users')
 * class UserController {
 *   @Get('/')
 *   getUsers() {
 *     return ['user1', 'user2'];
 *   }
 * }
 * ```
 * @since 2.0.0
 */
function Routerize(Route, mountpoint) {
    let ExpressiveTeaRoute = class ExpressiveTeaRoute extends Route {
        constructor(...args) {
            var _a, _b;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            super(...args);
            const handlers = (_a = Metadata_1.default.get(constants_1.ROUTER_HANDLERS_KEY, this)) !== null && _a !== void 0 ? _a : [];
            this.router = (0, express_1.Router)();
            this.mountpoint = mountpoint;
            for (const handler of handlers) {
                const middlewares = (_b = handler.handler.$middlewares) !== null && _b !== void 0 ? _b : [];
                const verb = handler.verb;
                const routeMethod = this.router[verb];
                if (typeof routeMethod === 'function') {
                    const allHandlers = [...middlewares, this.__registerHandler(handler)];
                    routeMethod.apply(this.router, [handler.route, ...allHandlers]);
                }
            }
        }
        __mount(parent) {
            const rootMiddlewares = Metadata_1.default.get(constants_1.ROUTER_MIDDLEWARES_KEY, this) || [];
            parent.use(this.mountpoint, ...rootMiddlewares, this.router);
            return this;
        }
        __registerHandler(options) {
            const decoratedArguments = Metadata_1.default.get(constants_1.ARGUMENTS_KEY, options.target, options.propertyKey);
            const annotations = Metadata_1.default.get(constants_1.ROUTER_ANNOTATIONS_KEY, options.target, options.propertyKey);
            const optionsWithArgs = options;
            return server_1.executeRequest.bind({
                options: optionsWithArgs,
                decoratedArguments,
                annotations,
                self: this
            });
        }
    };
    ExpressiveTeaRoute = tslib_1.__decorate([
        (0, inversify_1.injectable)('Singleton'),
        (0, inversify_1.injectFromBase)({ extendConstructorArguments: true }),
        tslib_1.__metadata("design:paramtypes", [Object])
    ], ExpressiveTeaRoute);
    return ExpressiveTeaRoute;
}
