import { polishFileContent } from '../../utils';

export default () =>
  polishFileContent(`
import { fromApp } from '@machinat/stream';
import main from './main';
import createApp from './app'

const app = createApp();
app
  .start()
  .then(() => {
    main(fromApp(app));
  })
  .catch(console.error)
`);
