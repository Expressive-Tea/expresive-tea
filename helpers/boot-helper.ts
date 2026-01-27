
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import {
  BOOT_STAGES,
  BOOT_STAGES_KEY,
  REGISTERED_DIRECTIVES_KEY,
  REGISTERED_MODULE_KEY,
  REGISTERED_STATIC_KEY,
  STAGES_INIT
} from '@expressive-tea/commons/constants';
import * as express from 'express';
import { type Express } from 'express';
import MetaData from '@expressive-tea/commons/classes/Metadata';
import { getClass } from '@expressive-tea/commons/helpers/object-helper';
import { type ExpressiveTeaDirective, type ExpressiveTeaStatic } from '@expressive-tea/commons/interfaces';
import { BootLoaderRequiredExceptions, BootLoaderSoftExceptions } from '../exceptions/BootLoaderExceptions';
import type Boot from '../classes/Boot';
import { type ModulizedExpressiveTeaModule } from '../types/core';

export async function resolveStage(stage: BOOT_STAGES, ctx: Boot, server: Express, ...extraArgs: unknown[]): Promise<void> {
  try {
    await bootloaderResolve(stage, server, ctx, ...extraArgs);
    if (stage === BOOT_STAGES.APPLICATION) {
      resolveModules(ctx, server);
    }
  } catch (e) {
    if (checkIfStageFails(e as Error)) {
      throw e;
    }
  }
}

export function resolveDirectives(instance: typeof Boot | Boot, server: Express): void {
  const registeredDirectives = MetaData.get(REGISTERED_DIRECTIVES_KEY, getClass(instance)) || [];
  registeredDirectives.forEach((options: ExpressiveTeaDirective) => {
    // @ts-expect-error Settings can be any parameter
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    server.set(options.name, ...options.settings);
  });
}

export function resolveStatic(instance: typeof Boot | Boot, server: Express): void {
  const registeredStatic = MetaData.get(REGISTERED_STATIC_KEY, getClass(instance)) || [];
  registeredStatic.forEach((staticOptions: ExpressiveTeaStatic) => {
    if (staticOptions.virtual) {
      server.use(staticOptions.virtual, express.static(staticOptions.root, staticOptions.options));
    } else {
      server.use(express.static(staticOptions.root, staticOptions.options));
    }

  });
}

export function resolveProxy(ProxyContainer: any, server: Express): void {
  const proxyContainer = new ProxyContainer();
  proxyContainer.__register(server);
}

function resolveModules(instance: typeof Boot | Boot, server: Express): void {
  const registeredModules: ModulizedExpressiveTeaModule<any> = MetaData.get(REGISTERED_MODULE_KEY, instance, 'start') || [];
  for ( const Module of registeredModules ) {
    const moduleInstance: ModulizedExpressiveTeaModule<typeof Module> = new Module();
    moduleInstance.__register(server);
  }
}

async function bootloaderResolve(
  STAGE: BOOT_STAGES,
  server: Express,
  instance: typeof Boot | Boot,
  ...args: unknown[]): Promise<void> {

  const bootLoader = MetaData.get(BOOT_STAGES_KEY, getClass(instance)) || STAGES_INIT;

  for (const loader of bootLoader[STAGE] || []) {
    try {
      await selectLoaderType(loader, server, ...args);
    } catch (e) {
      shouldFailIfRequire(e as Error, loader);
    }
  }
}

function selectLoaderType(loader, server: Express, ...args: unknown[]) {
  return loader.method(server, ...args);
}

function checkIfStageFails(e: BootLoaderRequiredExceptions | BootLoaderSoftExceptions | Error) {
  return !(e instanceof BootLoaderSoftExceptions);
}

function shouldFailIfRequire(e: BootLoaderRequiredExceptions | BootLoaderSoftExceptions | Error, loader) {
  const failMessage = `Failed [${loader.name}]: ${e.message}`;
  if (!loader || loader.required) {
    throw new BootLoaderRequiredExceptions(failMessage);
  }

  throw new BootLoaderSoftExceptions(`${failMessage} and will be not enabled`);
}
