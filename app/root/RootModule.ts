import RootController from '@app/root/controllers/RootController';
import { Module } from '@core/decorators/module';

@Module({
  controllers: [RootController],
  mountpoint: '/'
})
export class RootModule {
}
