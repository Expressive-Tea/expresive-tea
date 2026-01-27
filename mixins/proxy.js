"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Proxify = Proxify;
const httpProxy = require("express-http-proxy");
const Metadata_1 = require("@expressive-tea/commons/classes/Metadata");
const constants_1 = require("@expressive-tea/commons/constants");
const lodash_1 = require("lodash");
const object_helper_1 = require("@expressive-tea/commons/helpers/object-helper");
function Proxify(Base, source, targetUrl) {
    return class ExpressiveTeaProxy extends Base {
        constructor(...args) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            super(...args);
            this.source = source;
            this.target = targetUrl;
            const options = {};
            const host = Metadata_1.default.get(constants_1.PROXY_SETTING_KEY, this, constants_1.PROXY_METHODS.HOST);
            for (const value of Object.values(constants_1.PROXY_METHODS)) {
                if (value !== constants_1.PROXY_METHODS.HOST) {
                    options[value] = Metadata_1.default.get(constants_1.PROXY_SETTING_KEY, this, value);
                }
            }
            for (const value of Object.values(constants_1.PROXY_PROPERTIES)) {
                const key = Metadata_1.default.get(constants_1.PROXY_SETTING_KEY, this, value);
                if (!(0, lodash_1.isUndefined)(key)) {
                    // @ts-expect-error:next-line
                    options[value] = this[key];
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            this.proxyHandler = httpProxy(host ? host.value.bind(this) : this.target);
        }
        __register(server) {
            const proxyMetadata = Metadata_1.default.get(constants_1.PROXY_SETTING_KEY, (0, object_helper_1.getClass)(this));
            console.info(`[PROXY - ${proxyMetadata.name}] ${this.source} -> ${this.target}`);
            server.use(this.source, this.proxyHandler);
        }
    };
}
