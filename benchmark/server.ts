import Boot from '../classes/Boot';
import { Plug, ServerSettings } from '../decorators/server';
import { BOOT_STAGES } from '@expressive-tea/commons/constants';

function middlewares(application) {
  let n = parseInt(process.env.MW || '1', 10);
  console.log('  %s middleware', n);

  while (n--) {
    application.use((req, res, next) => next());
  }

  application.use((req, res) => res.send('Hello World'));
}

@ServerSettings({ port: 8888 })
@Plug(BOOT_STAGES.APPLICATION, 'Benchmark Hello World', middlewares, true)
class Test extends Boot {
}

const server = new Test();
export default server.start();
