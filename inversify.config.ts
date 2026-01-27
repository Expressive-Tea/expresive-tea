import { Container } from 'inversify';
import getDecorators from 'inversify-inject-decorators';

const container = new Container();

export const decorators = getDecorators(container);
export default container;
