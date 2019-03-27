# Expressive Tea
> A Typescript library to create RESTful Services.

## Description
Expressive Tea is a simple library which allow to generate RESTful services with Typescript over Expressjs.

## Features
* Server Initialization and Configurations with ability to setup server through server stages.
* Declare Server Middlewares configuration as hard or soft dependency at server level.
* Declarative Modules to allow create modular RESTful Servers.
* Dependency Injection on controllers as providers with InversifyJs.
* Declarative Router on Controllers.
* Declarative Verbs and Middlewares under module and verb level.
* Declarative Exceptions for a better Error Handling.
* Can declare models depending on your flavor, we recommend Mongoose or Sequelize flavors.


## Why
The main idea is help developers to generate a RESTful service quick and modulable through descriptive decorators and settings
on top of ExpressJS. Expressive Tea is a clean, simple and descriptive mini framework which allow create REST services quickly
saving time with the creation of routers and other express components with a clean, descriptive decorator.

## Installation
```bash
npm i --save @zerooneit/expressive-tea
```

> **Important!** Expressive Tea requires Node >= 6, Express >= 4, TypeScript >= 2.0 and the `experimentalDecorators`, 
`lib` compilation options in your `tsconfig.json` file.

## Quick Start
### Declare a Server
```typescript
/** Main Middlewares configuration for server **/
import databaseInitialize from './database';
import expressInitialize from './express';
import errorHandling from './errorHandling';

/** Get Boot class **/
import Boot from '@zerooneit/expressive-tea/classes/Boot';

/** Get Boot Stages Enum **/
import { BOOT_STAGES } from '@zerooneit/expressive-tea/libs/constants';

/** Get Main Decorators **/
import { Plug, ServerSettings } from '@zerooneit/expressive-tea/decorators/server';

@ServerSettings()
@Plug(BOOT_STAGES.BOOT_DEPENDENCIES, 'Database Initialization', databaseInitialize, true)
@Plug(BOOT_STAGES.INITIALIZE_MIDDLEWARES, 'Express Initialization', expressInitialize, true)
@Plug(BOOT_STAGES.AFTER_APPLICATION_MIDDLEWARES, 'Error Handlers Initialization', errorHandling, true)
class BootLoader extends Boot {
}

export default new BootLoader().start()
.catch(error => console.log(error.message));
```
### Please don't used yet, is still on development.
