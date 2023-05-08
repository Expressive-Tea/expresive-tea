import {
  ExpressiveTeaHandlerOptions,
} from '@expressive-tea/commons/interfaces';

export interface ExpressiveTeaHandlerOptionsWithInstrospectedArgs extends ExpressiveTeaHandlerOptions {
  introspectedArgs: string[];
}
