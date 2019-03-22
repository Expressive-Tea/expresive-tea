export enum BOOT_STAGES {
  BOOT_DEPENDENCIES,
  INITIALIZE_MIDDLEWARES,
  APPLICATION,
  AFTER_APPLICATION_MIDDLEWARES,
  START
}

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

export const YESNOUNSURE_ENUM = ['yes', 'no', 'unsure'];
export const YESNO_ENUM = ['yes', 'no'];
export const PET_TYPE_ENUM = ['dog', 'cat', 'bird', 'rabbit', 'small-animal', 'farm-animal', 'other'];

export const JWT_SECRET = process.env.JWT_SECRET || 'Cd1MMpk/myZT+V8ohkrIaA==';
export const JWT_ISSUER = process.env.JWT_ISSUER || 'accounts.test.org.dev';
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'org.test';
export const JWT_HEADER = process.env.JWT_HEADER || 'authorization';
export const REGISTERED_MODEL_KEY = 'app:models:registered';
