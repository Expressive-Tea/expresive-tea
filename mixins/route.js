"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Routerize = Routerize;
const tslib_1 = require("tslib");
const express_1 = require("express");
const commons_1 = require("@expressive-tea/commons");
const commons_2 = require("@expressive-tea/commons");
const server_1 = require("../helpers/server");
const inversify_1 = require("inversify");
const DependencyInjection_1 = require("@services/DependencyInjection");
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
            // Metadata is stored on the original class prototype by decorators
            // Route is the base class, so Route.prototype is where metadata is stored
            const handlers = (_a = commons_1.Metadata.get(commons_2.ROUTER_HANDLERS_KEY, Route.prototype)) !== null && _a !== void 0 ? _a : [];
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
            // Metadata is stored on the original class prototype by decorators
            const rootMiddlewares = commons_1.Metadata.get(commons_2.ROUTER_MIDDLEWARES_KEY, Route.prototype) || [];
            parent.use(this.mountpoint, ...rootMiddlewares, this.router);
            return this;
        }
        __registerHandler(options) {
            const decoratedArguments = commons_1.Metadata.get(commons_2.ARGUMENTS_KEY, options.target, options.propertyKey);
            const annotations = commons_1.Metadata.get(commons_2.ROUTER_ANNOTATIONS_KEY, options.target, options.propertyKey);
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
    // Bind the original class to the wrapped class in the DI container
    // This ensures that when modules request the original class via getInstanceOf(),
    // they receive an instance of the wrapped ExpressiveTeaRoute class instead
    try {
        if (DependencyInjection_1.default.Container.isBound(Route)) {
            DependencyInjection_1.default.Container.unbind(Route);
        }
        DependencyInjection_1.default.Container.bind(Route).to(ExpressiveTeaRoute);
    }
    catch (error) {
        // Binding may fail in some contexts, but that's okay - the class is still usable
    }
    return ExpressiveTeaRoute;
}
