import { polishFileContent } from '../../templateHelper';

export default () =>
  polishFileContent(`
import { fromApp } from '@machinat/stream';
import main from './main';
import app from './app'

app
  .start()
  .then(() => {
    main(fromApp(app));
  })
  .catch(console.error)
`);
