/**
 * Test Application for Benchmarking
 * Provides a simple Express Tea application for performance testing
 */

import 'reflect-metadata';
import Boot from '../../../classes/Boot';
import { Modules } from '../../../decorators/server';
import { Module } from '../../../decorators/module';
import { Get, Post, Route } from '../../../decorators/router';
import { param, body } from '../../../decorators/annotations';
import Settings from '../../../classes/Settings';

/**
 * Test controller with various endpoints
 */
@Route('/')
class BenchmarkController {
  @Get('/')
  root() {
    return { message: 'ok' };
  }

  @Get('/health')
  health() {
    return { status: 'healthy', timestamp: Date.now() };
  }

  @Get('/echo/:message')
  echo(@param('message') message: string) {
    return { echo: message };
  }

  @Post('/data')
  data(@body() data: any) {
    return { received: data, processed: true };
  }

  @Get('/json/small')
  smallJson() {
    return { id: 1, name: 'test', active: true };
  }

  @Get('/json/medium')
  mediumJson() {
    return {
      id: 1,
      name: 'test',
      description: 'A medium-sized JSON response for benchmarking',
      metadata: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        tags: ['benchmark', 'test', 'performance']
      },
      items: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        value: `item-${i}`,
        active: i % 2 === 0
      }))
    };
  }

  @Get('/json/large')
  largeJson() {
    return {
      id: 1,
      name: 'test',
      description: 'A large JSON response for benchmarking',
      metadata: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        tags: Array.from({ length: 100 }, (_, i) => `tag-${i}`)
      },
      items: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `item-${i}`,
        description: `Description for item ${i}`,
        value: Math.random() * 1000,
        active: i % 2 === 0,
        metadata: {
          created: new Date().toISOString(),
          category: `category-${i % 10}`
        }
      }))
    };
  }
}

/**
 * Test module
 */
@Module({
  controllers: [BenchmarkController],
  mountpoint: '/'
})
class BenchmarkModule {}

/**
 * Test application
 */
@Modules([BenchmarkModule])
export class BenchmarkApp extends Boot {}

/**
 * Create a test application instance
 */
export async function createBenchmarkApp(port?: number) {
  Settings.reset();
  if (port) {
    Settings.getInstance().set('port', port);
  }

  const app = new BenchmarkApp();
  const instance = await app.start();

  return instance;
}

