/**
 * As Expressive Tea have some stages when is boot the application, this enum helps to attach plugin when use the Pour
 * or Plug decorations and this is the definition.
 *
 * BOOT_DEPENDENCIES: Used for some application dependencies, example, databases configuration or websocket settings.
 *
 * INITIALIZE_MIDDLEWARES: Used for application middlewares, example body-parser, cors, sessions express plugins.
 *
 * APPLICATION: Used internally to register all modules registered by Module decorator.
 *
 * AFTER_APPLICATION_MIDDLEWARES: Used to add middlewares after  routers, commonly used for Error handling.
 *
 * START: This Stage is used to execute some code or attach middlewares before application starts and might be used to
 * settings something after  plugins/middlewares registered.
 *
 * @inner
 * @export
 * @enum {number}
 * @summary Available Boot Stages
 */
export enum BOOT_STAGES {
  BOOT_DEPENDENCIES,
  INITIALIZE_MIDDLEWARES,
  APPLICATION,
  AFTER_APPLICATION_MIDDLEWARES,
  START
}

/**
 * This Determinate how the application is booting internally, this should not be modified unless you know what are you
 * doing, however, even that is the case should not be modified. The Order is the next one:
 *
 * BOOT_DEPENDENCIES --> INITIALIZE_MIDDLEWARES --> APPLICATION --> AFTER_APPLICATION_MIDDLEWARES --> START
 * @inner
 * @type Array<BOOT_STAGES>
 * @constant
 * @summary Current Aplication Boot Order
 */
export const BOOT_ORDER = [
  BOOT_STAGES.BOOT_DEPENDENCIES,
  BOOT_STAGES.INITIALIZE_MIDDLEWARES,
  BOOT_STAGES.APPLICATION,
  BOOT_STAGES.AFTER_APPLICATION_MIDDLEWARES,
  BOOT_STAGES.START
];

export const STAGES_INIT = {
  [BOOT_STAGES.BOOT_DEPENDENCIES]: [],
  [BOOT_STAGES.INITIALIZE_MIDDLEWARES]: [],
  [BOOT_STAGES.APPLICATION]: [],
  [BOOT_STAGES.AFTER_APPLICATION_MIDDLEWARES]: [],
  [BOOT_STAGES.START]: []
};

export const BOOT_STAGES_KEY = 'boot:stage-settings';
export const ROUTER_HANDLERS_KEY = 'app:routes:handlers';
export const ROUTER_MIDDLEWARES_KEY = 'app:routes:middlewares';
export const REGISTERED_MODEL_KEY = 'app:models:registered';
export const REGISTERED_MODULE_KEY = 'app:modules:registered';
export const PLUGINS_KEY = 'boot:app-plugins';
