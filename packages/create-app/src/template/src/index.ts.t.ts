export default (): string => `
import { fromApp } from '@sociably/stream';
import main from './main.js';
import createApp from './app.js'

const app = createApp();
await app.start();

const event$ = fromApp(app);
main(event$);
`;
