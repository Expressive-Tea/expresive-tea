import {Module} from '../../../../../decorators/module';
import RootController from './controllers/RootController';

@Module({
  controllers: [RootController],
  providers: [],
  mountpoint: '/'
})
export default class RootModule {
}
