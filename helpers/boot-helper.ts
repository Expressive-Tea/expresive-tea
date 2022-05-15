// tslint:disable:no-duplicate-imports

import {
  BOOT_STAGES,
  BOOT_STAGES_KEY,
  REGISTERED_DIRECTIVES_KEY,
  REGISTERED_MODULE_KEY,
  REGISTERED_STATIC_KEY,
  STAGES_INIT,
  PROXY_SETTING_KEY
} from '../libs/constants';
import * as express from 'express';
import { Express } from 'express';
import MetaData from '../classes/MetaData';
import { getClass } from './object-helper';
import { ExpressiveTeaDirective, ExpressiveTeaStatic, IExpressiveTeaProxySettings, IExpressiveTeaProxy } from '../libs/interfaces';
import { BootLoaderRequiredExceptions, BootLoaderSoftExceptions } from '../exceptions/BootLoaderExceptions';
import Boot from '../classes/Boot';
import * as httpProxy from 'express-http-proxy';

export async function resolveStage(stage: BOOT_STAGES, ctx: Boot, server: Express, ...extraArgs: unknown[]): Promise<void> {
  try {
    await bootloaderResolve(stage, server, ctx, ...extraArgs);
    if (stage === BOOT_STAGES.APPLICATION) {
      await resolveModules(ctx, server);
    }
  } catch (e) {
    if (checkIfStageFails(e)) {
      throw e;
    }
  }
}

export async function resolveDirectives(instance: typeof Boot | Boot, server: Express): Promise<void> {
  const registeredDirectives = MetaData.get(REGISTERED_DIRECTIVES_KEY, getClass(instance)) || [];
  registeredDirectives.forEach((options: ExpressiveTeaDirective) => {
    server.set.call(server, options.name, ...options.settings);
  });
}

export async function resolveStatic(instance: typeof Boot | Boot, server: Express): Promise<void> {
  const registeredStatic = MetaData.get(REGISTERED_STATIC_KEY, getClass(instance)) || [];
  registeredStatic.forEach((staticOptions: ExpressiveTeaStatic) => {
    if (staticOptions.virtual) {
      server.use(staticOptions.virtual, express.static(staticOptions.root, staticOptions.options));
    } else {
      server.use(express.static(staticOptions.root, staticOptions.options));
    }

  });
}

export async function resolveProxy(ProxyContainer: any, server: Express): Promise<void> {
  const proxyContainer = new ProxyContainer();
  proxyContainer.__register(server);
}

async function resolveModules(instance: typeof Boot | Boot, server: Express): Promise<void> {
  const registeredModules = MetaData.get(REGISTERED_MODULE_KEY, instance, 'start') || [];
  registeredModules.forEach(Module => {
    const moduleInstance = new Module();
    moduleInstance.__register(server);
  });
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
      shouldFailIfRequire(e, loader);
    }
  }
}

async function selectLoaderType(loader, server: Express, ...args: unknown[]) {
  return loader.method(server, ...args);
}

function checkIfStageFails(e: BootLoaderRequiredExceptions | BootLoaderSoftExceptions | Error) {
  return !(e instanceof BootLoaderSoftExceptions)
}

function shouldFailIfRequire(e: BootLoaderRequiredExceptions | BootLoaderSoftExceptions | Error, loader) {
  const failMessage = `Failed [${loader.name}]: ${e.message}`;
  if (!loader || loader.required) {
    throw new BootLoaderRequiredExceptions(failMessage);
  }

  throw new BootLoaderSoftExceptions(`${failMessage} and will be not enabled`);
}
