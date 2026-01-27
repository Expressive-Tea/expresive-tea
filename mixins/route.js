"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Routerize = Routerize;
const express_1 = require("express");
const Metadata_1 = require("@expressive-tea/commons/classes/Metadata");
const constants_1 = require("@expressive-tea/commons/constants");
const server_1 = require("../helpers/server");
function Routerize(Route, mountpoint) {
    return class ExpressiveTeaRoute extends Route {
        constructor(...args) {
            var _a, _b;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            super(...args);
            const handlers = (_a = Metadata_1.default.get(constants_1.ROUTER_HANDLERS_KEY, this)) !== null && _a !== void 0 ? _a : [];
            this.router = (0, express_1.Router)();
            this.mountpoint = mountpoint;
            for (const handler of handlers) {
                const middlewares = (_b = handler.handler.$middlewares) !== null && _b !== void 0 ? _b : [];
                this.router[handler.verb](handler.route, ...middlewares, this.__registerHandler(handler));
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
            return server_1.executeRequest.bind({
                options,
                decoratedArguments,
                annotations,
                self: this
            });
        }
    };
}
