"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Proxify = Proxify;
const tslib_1 = require("tslib");
const httpProxy = require("express-http-proxy");
const Metadata_1 = require("@expressive-tea/commons/classes/Metadata");
const constants_1 = require("@expressive-tea/commons/constants");
const utilities_1 = require("../libs/utilities");
const object_helper_1 = require("@expressive-tea/commons/helpers/object-helper");
const inversify_1 = require("inversify");
/**
 * Proxify mixin - Adds Expressive Tea HTTP proxy capabilities to a class
 *
 * Transforms a regular class into an Expressive Tea proxy with:
 * - HTTP proxy configuration
 * - Request/response transformation
 * - Custom headers and options
 * - Automatic proxy registration
 *
 * @template TBase - The base constructor type to extend
 * @param {TBase} Base - The base class to extend
 * @param {string} source - The source path to proxy from (e.g., '/api')
 * @param {string} targetUrl - The target URL to proxy to (e.g., 'http://api.example.com')
 * @returns {ProxifiedClass<TBase>} The enhanced class with proxy capabilities
 *
 * @example
 * ```typescript
 * @Proxy('/api', 'http://api.example.com')
 * class ApiProxy {
 *   @ProxyHost()
 *   getHost() {
 *     return 'http://api.example.com';
 *   }
 * }
 * ```
 * @since 2.0.0
 */
function Proxify(Base, source, targetUrl) {
    let ExpressiveTeaProxy = class ExpressiveTeaProxy extends Base {
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
                if (!(0, utilities_1.isUndefined)(key)) {
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
    ExpressiveTeaProxy = tslib_1.__decorate([
        (0, inversify_1.injectable)('Singleton'),
        (0, inversify_1.injectFromBase)({ extendConstructorArguments: true }),
        tslib_1.__metadata("design:paramtypes", [Object])
    ], ExpressiveTeaProxy);
    return ExpressiveTeaProxy;
}
