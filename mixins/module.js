"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modulize = Modulize;
const express_1 = require("express");
const DependencyInjection_1 = require("../services/DependencyInjection");
function Modulize(Base, options) {
    return class ExpressiveTeaModule extends Base {
        constructor(...args) {
            var _a;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            super(...args);
            this.settings = options;
            this.router = (0, express_1.Router)();
            this.controllers = options.controllers.map(C => new C());
            for (const Provider of (_a = options.providers) !== null && _a !== void 0 ? _a : []) {
                DependencyInjection_1.default.setProvider(Provider);
            }
        }
        __register(server) {
            for (const controller of this.controllers) {
                controller.__mount(this.router);
            }
            server.use(this.settings.mountpoint, this.router);
        }
    };
}
