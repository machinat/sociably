import { CreateAppContext } from '../../../types';
import { when, polishFileContent } from '../../../utils';

export default ({ platforms }: CreateAppContext) =>
  polishFileContent(`
import Machinat from '@machinat/core';${when(platforms.includes('webview'))`
import WithWebviewLink from '../components/WithWebviewLink';`}
import { ChatEventContext } from '../types';

const handleMessage = async ({
  event,
  reply,
}: ChatEventContext & { event: { category: 'message' } }) => {
  await reply(${
    platforms.includes('webview')
      ? `
    <WithWebviewLink>
      Hello {event.type === 'text' ? event.text : 'World'}!
    </WithWebviewLink>`
      : `
    <p>Hello {event.type === 'text' ? event.text : 'World'}!</p>`
  }
  );
};

export default handleMessage;
`);
