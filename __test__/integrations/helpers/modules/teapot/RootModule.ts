import {Module} from '../../../../../decorators/module';
import RootController from './controllers/RootController';

@Module({
  controllers: [RootController],
  mountpoint: '/'
})
export default class RootModule {
}
