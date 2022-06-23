export default (): string => `
import { fromApp } from '@sociably/stream';
import main from './main';
import createApp from './app'

const app = createApp();
app
  .start()
  .then(() => {
    main(fromApp(app));
  })
  .catch(console.error)
`;
