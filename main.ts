import appInitialize from '@config/app-initialize';
import errorHandling from '@config/errorHandling';
import expressConfig from '@config/express';
import passportConfig from '@config/passport';
import Boot from '@core/classes/Boot';
import { BOOT_STAGES } from '@core/constants';
import { Plug, ServerSettings } from '@core/decorators/server';

@ServerSettings()
@Plug(BOOT_STAGES.INITIALIZE_MIDDLEWARES, 'Passport Initialization', passportConfig, true)
@Plug(BOOT_STAGES.INITIALIZE_MIDDLEWARES, 'Express Initialization', expressConfig, true)
@Plug(BOOT_STAGES.APPLICATION, 'App Initialization', appInitialize, true)
@Plug(BOOT_STAGES.AFTER_APPLICATION_MIDDLEWARES, 'Error Handlers Initialization', errorHandling, true)
class BootLoader extends Boot {
}

export default new BootLoader().start()
  .catch(error => console.log(error.message));
