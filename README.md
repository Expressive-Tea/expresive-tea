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
`lib` compilation options in your `tsconfig.json` with the next configuration.

```json
{
	"compilerOptions": {
      "baseUrl": ".",
      "sourceMap": true,
      "noEmit": false,
      "noImplicitAny": false,
      "target": "es2015",
      "lib": ["es2015", "dom"],
      "types": ["reflect-metadata"],
      "module": "commonjs",
      "moduleResolution": "node",
      "experimentalDecorators":true,
      "emitDecoratorMetadata": true,
      "declaration": true
	},
	"include": [
		"node_modules/@zerooneit/expressive-tea"
	]
}
```
### Examples
You can looking into our simple example [here](https://github.com/Zero-OneiT/expressive-tea-example).

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
### Generate Modules
```typescript
import ControllerA from './controllers/ControllerA';
import ControllerB from './controllers/ControllerB';
import Provider from './services/Provider';
import { Module } from '@zerooneit/expressive-tea/decorators/module';


@Module({
  // Assign Controllers to Module
  controllers: [ControllerA, ControllerB],
  // Assign Root Mountpoint Path
  mountpoint: '/test',
  // Assign Providers with dependency injection.
  providers: [Provider]
})
export class TestModule {
}
```

### Generate Controllers
```typescript
import { authenticate } from './middlewares/authentication';
import { Model } from '@zerooneit/expressive-tea/decorators/model';
import { Get, Middleware, Param, Patch, Post, Route } from '@zerooneit/expressive-tea/decorators/router';
import DI from '@zerooneit/expressive-tea/services/DependencyInjection';

const di = DI.getInstance();

// controller root which will mounted over the module mounpooint
@Route('/')
class Users {
  @Model('User')
  model: any;

  @di.getDecorators().Inject('AProviderService')
  providerService: any;

  @Param('userId')
  async getId(req, res, next, userId) {
    // ...
  }

  @Get('/me')
  @Middleware(authenticate)
  async getMe(req, res) {
    // ...
  }

  @Patch('/me')
  @Middleware(authenticate)
  async updateMe(req, res) {
    // ...
  }

  @Get('/:userId')
  @Middleware(authenticate)
  async getUser(req, res) {
    // ...
  }

  @Patch('/')
  async create(req, res, next) {
    // ...
  }

  @Post('/:userId/import')
  async importVcard(req, res, next) {
    // ...
  }



  @Get('/me/connections')
  @Middleware(authenticate)
  async getConnections(req, res, next) {
    //...
  }
}

export default Users;
```
### Now we are on beta.
