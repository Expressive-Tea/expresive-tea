/**
 * @namespace Exceptions
 */
/**
 * Exception Class for Hard Required Plugins.
 * This Exception is used internally to describe when a required plugin fails, is the server returns this
 * is meaning a module fails and the application it wont start since the plugin is marked as hard require to initialize
 * the application.
 * @export
 * @class BootLoaderRequiredExceptions
 * @extends {Error}
 * @summary Required Module Exception
 */
export class BootLoaderRequiredExceptions extends Error {}

/**
 * Exception Class for Soft Required Plugins
 * This Exception is used internally to describe when a required plugin fails but allow to continue running
 * the application and it means that plugin fails to initialize but is not critical to the app.
 * @export
 * @class BootLoaderSoftExceptions
 * @extends {Error}
 * @summary Not Required Plugin Exception
 */
export class BootLoaderSoftExceptions extends Error {}
