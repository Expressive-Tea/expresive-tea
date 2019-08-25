import { Express } from 'express';
import { BOOT_STAGES } from '../libs/constants';
import Settings from './Settings';

interface ExpressiveTeaPlug {
  register(app: Express, settings: Settings): Promise<any>;
}

abstract class ExpressiveTeaPlugin implements ExpressiveTeaPlug {
  readonly name: string;
  readonly stage: BOOT_STAGES;
  readonly required: boolean = false;

  async register(app: Express, settings: Settings) {
    throw new Error('Plugin has not defined register');
  }
}

export default ExpressiveTeaPlugin;
