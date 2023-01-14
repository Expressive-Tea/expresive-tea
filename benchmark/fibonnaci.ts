import Boot from '../classes/Boot';
import { Plug, ServerSettings } from '../decorators/server';
import { BOOT_STAGES } from '@expressive-tea/commons/constants';

function middlewares(application) {
  let n = parseInt(process.env.MW || '1', 10);
  console.log('  %s middleware', n);

  while (n--) {
    application.use((req, res, next) => next());
  }

  application.use((req, res) => res.json({ data: fibonacci(100000)}));
}

function fibonacci(num) {
  let a = 0;
  let b = 1;
  let temp;

  while (num > 0) {
    temp = b;
    b = b + a;
    a = temp;
    num--;
  }
  return a;
}

@ServerSettings({ port: 8888 })
@Plug(BOOT_STAGES.APPLICATION, 'Benchmark Fibonnaci', middlewares, true)
class Test extends Boot {
}

const server = new Test();
export default server.start();
