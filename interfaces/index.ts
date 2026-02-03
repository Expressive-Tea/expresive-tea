import {
  type ExpressiveTeaHandlerOptions,
} from '@expressive-tea/commons';

export interface ExpressiveTeaHandlerOptionsWithInstrospectedArgs extends ExpressiveTeaHandlerOptions {
  introspectedArgs: string[];
}
