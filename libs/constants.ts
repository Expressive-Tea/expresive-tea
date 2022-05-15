// tslint:disable:max-line-length
/**
 * As Expressive Tea have some stages when is boot the application, this enum helps to attach plugin when use the Pour
 * or Plug decorations and this is the definition.
 *
 * <b>BOOT_DEPENDENCIES</b>: Used for some application dependencies, example, databases configuration or websocket settings.
 *
 * <b>INITIALIZE_MIDDLEWARES</b>: Used for application middlewares, example body-parser, cors, sessions express plugins.
 *
 * <b>APPLICATION</b>: Used internally to register all modules registered by Module decorator.
 *
 * <b>AFTER_APPLICATION_MIDDLEWARES</b>: Used to add middlewares after  routers, commonly used for Error handling.
 *
 * <b>START</b>: This Stage is used to execute some code or attach middlewares before application starts and might be used to
 * settings something after  plugins/middlewares registered.
 *
 * @inner
 * @export
 * @enum {number}
 * @summary Available Boot Stages
 */

// tslint:enable:max-line-length
export enum BOOT_STAGES {
  BOOT_DEPENDENCIES,
  INITIALIZE_MIDDLEWARES,
  APPLICATION,
  AFTER_APPLICATION_MIDDLEWARES,
  START,
  ON_HTTP_CREATION
}

/**
 * This Determinate how the application is booting internally, this should not be modified unless you know what are you
 * doing, however, even that is the case should not be modified. The Order is the next one:
 *
 * <b><i>BOOT_DEPENDENCIES</i></b> --> <b><i>INITIALIZE_MIDDLEWARES</i></b> --> <b><i>APPLICATION</i></b> -->
 * <b><i>AFTER_APPLICATION_MIDDLEWARES</i></b> --> <b><i>START</i></b>
 * @inner
 * @type Array<BOOT_STAGES>
 * @constant
 * @summary Current Aplication Boot Order
 */
export const BOOT_ORDER = [
  BOOT_STAGES.BOOT_DEPENDENCIES,
  BOOT_STAGES.INITIALIZE_MIDDLEWARES,
  BOOT_STAGES.APPLICATION
];

export const BOOT_STAGES_LIST = [
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

export const EXPRESS_DIRECTIVES = [
  'case sensitive routing',
  'env',
  'etag',
  'jsonp callback name',
  'json escape',
  'json replacer',
  'json spaces',
  'query parser',
  'strict routing',
  'subdomain offset',
  'trust proxy',
  'views',
  'view cache',
  'view engine',
  'x-powered-by'
];

export const BOOT_STAGES_KEY = 'boot:stage-settings';
export const ROUTER_HANDLERS_KEY = 'app:routes:handlers';
export const ROUTER_MIDDLEWARES_KEY = 'app:routes:middlewares';
export const ROUTER_PROXIES_KEY = 'app:routes:proxies';
export const PROXY_SETTING_KEY = 'app:proxy:settings';
export const REGISTERED_MODEL_KEY = 'app:models:registered';
export const REGISTERED_MODULE_KEY = 'app:modules:registered';
export const PLUGINS_KEY = 'boot:app-plugins';
export const REGISTERED_STATIC_KEY = 'app:statics';
export const REGISTERED_DIRECTIVES_KEY = 'app:directives';
export const ARGUMENTS_KEY = 'app:routes:arguments';
export const ROUTER_ANNOTATIONS_KEY = 'app:routes:annotations';
export const ASSIGN_TEAPOT_KEY = 'app:gateway:teapot';
export const ASSIGN_TEACUP_KEY = 'app:gateway:teacup';

export const ARGUMENT_TYPES = {
  BODY: Symbol('BODY'),
  GET_PARAM: Symbol('GET_PARAM'),
  NEXT: Symbol('NEXT'),
  QUERY: Symbol('QUERY'),
  REQUEST: Symbol('REQUEST'),
  RESPONSE: Symbol('RESPONSE')
};

export enum PROXY_METHODS {
  HOST = 'host',
  PROXY_REQ_PATH_RESOLVER = 'proxyReqPathResolver',
  FILTER = 'filter',
  USER_RES_DECORATOR = 'userResDecorator',
  USER_RES_HEADER_DECORATOR = 'userResHeaderDecorator',
  SKIP_TO_NEXT_HANDLER_FILTER = 'skipToNextHandlerFilter',
  PROXY_ERROR_HANDLER = 'proxyErrorHandler',
  PROXY_REQ_OPT_DECORATOR = 'proxyReqOptDecorator',
  PROXY_REQ_BODY_DECORATOR = 'proxyReqBodyDecorator'
}

// 'limit' | 'memoizeHost' | 'https' | 'preserveHostHdr' | 'parseReqBody' |
// 'reqAsBuffer' | 'reqBodyEncoding' | 'timeout';
export enum PROXY_PROPERTIES {
  LIMIT = 'limit',
  MEMOIZE_HOST = 'memoizeHost',
  HTTPS = 'https',
  PRESERVE_HOST_HDR = 'preserveHostHdr',
  PARSE_REQ_BODY = 'parseReqBody',
  REQ_AS_BUFFER = 'reqAsBuffer',
  REQ_BODY_ENCODING = 'reqBodyEncoding',
  TIMEOUT = 'timeout'
}
