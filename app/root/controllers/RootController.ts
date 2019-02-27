import { Get, Route } from '@core/decorators/router';

@Route('/')
class RootController {
  @Get('/')
  @Get('/also')
  index(req, res) {
    res.send('WORKS!!');
  }
}

export default RootController;
