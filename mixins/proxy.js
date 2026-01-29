"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Proxify = Proxify;
const tslib_1 = require("tslib");
const httpProxy = require("express-http-proxy");
const commons_1 = require("@expressive-tea/commons");
const commons_2 = require("@expressive-tea/commons");
const utilities_1 = require("@libs/utilities");
const commons_3 = require("@expressive-tea/commons");
const inversify_1 = require("inversify");
const DependencyInjection_1 = require("@services/DependencyInjection");
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
            const host = commons_1.Metadata.get(commons_2.PROXY_SETTING_KEY, this, commons_2.PROXY_METHODS.HOST);
            for (const value of Object.values(commons_2.PROXY_METHODS)) {
                if (value !== commons_2.PROXY_METHODS.HOST) {
                    options[value] = commons_1.Metadata.get(commons_2.PROXY_SETTING_KEY, this, value);
                }
            }
            for (const value of Object.values(commons_2.PROXY_PROPERTIES)) {
                const key = commons_1.Metadata.get(commons_2.PROXY_SETTING_KEY, this, value);
                if (!(0, utilities_1.isUndefined)(key)) {
                    options[value] = this[key];
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            this.proxyHandler = httpProxy(host ? host.value.bind(this) : this.target);
        }
        __register(server) {
            const proxyMetadata = commons_1.Metadata.get(commons_2.PROXY_SETTING_KEY, (0, commons_3.getClass)(this));
            console.info(`[PROXY - ${proxyMetadata.name}] ${this.source} -> ${this.target}`);
            server.use(this.source, this.proxyHandler);
        }
    };
    ExpressiveTeaProxy = tslib_1.__decorate([
        (0, inversify_1.injectable)('Singleton'),
        (0, inversify_1.injectFromBase)({ extendConstructorArguments: true }),
        tslib_1.__metadata("design:paramtypes", [Object])
    ], ExpressiveTeaProxy);
    // Bind the original class to the wrapped class in the DI container
    // This ensures that when the application requests the original proxy class,
    // it receives an instance of the wrapped ExpressiveTeaProxy class instead
    try {
        if (DependencyInjection_1.default.Container.isBound(Base)) {
            DependencyInjection_1.default.Container.unbind(Base);
        }
        DependencyInjection_1.default.Container.bind(Base).to(ExpressiveTeaProxy);
    }
    catch (error) {
        // Binding may fail in some contexts, but that's okay - the class is still usable
    }
    return ExpressiveTeaProxy;
}
