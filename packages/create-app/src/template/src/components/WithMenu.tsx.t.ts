import { when, polishFileContent } from '../../../utils';
import { CreateAppContext } from '../../../types';

export default ({ platforms }: CreateAppContext) =>
  polishFileContent(`
import Machinat, {
  MachinatNode,${when(platforms.includes('webview'))`
  makeContainer,`}
} from '@machinat/core';${when(platforms.includes('messenger'))`
import * as Messenger from '@machinat/messenger/components';`}${when(
    platforms.includes('telegram')
  )`
import * as Telegram from '@machinat/telegram/components';`}${when(
    platforms.includes('line')
  )`
import * as Line from '@machinat/line/components';`}${when(
    platforms.includes('webview')
  )`
import {
  ServerDomain,${when(platforms.includes('line'))`
  LineLiffId,`}
} from '../interface';`}

type WithMenuProps = {
  children: MachinatNode;
};

const WithMenu =${when(platforms.includes('webview'))`
  (domain: string${when(platforms.includes('line'))`, lineLiffId: string`}) =>`}
  ({ children }: WithMenuProps, { platform }) => {${when(
    platforms.includes('webview')
  )`
    const webviewText = 'Open Webview ↗️';`}
    const aboutText = 'About ℹ';
    const aboutData = JSON.stringify({ action: 'about' });

${when(platforms.includes('messenger'))`
    if (platform === 'messenger') {
      return (
        <Messenger.ButtonTemplate
          buttons={${`${when(platforms.includes('webview'))`
            <>`}
              <Messenger.PostbackButton title={aboutText} payload={aboutData} />${when(
                platforms.includes('webview')
              )`
              <Messenger.UrlButton
                title={webviewText}
                url={\`https://\${domain}/webview?platform=messenger\`}
                messengerExtensions
              />
            </>`}
          `}}
        >
          {children}
        </Messenger.ButtonTemplate>
      );
    }`}
${when(platforms.includes('telegram'))`
    if (platform === 'telegram') {
      return (
        <Telegram.Text
          replyMarkup={
            <Telegram.InlineKeyboard>
              <Telegram.CallbackButton text={aboutText} data={aboutData} />${when(
                platforms.includes('webview')
              )`
              <Telegram.UrlButton
                login
                text={webviewText}
                url={\`https://\${domain}/auth/telegram\`}
              />`}
            </Telegram.InlineKeyboard>
          }
        >
          {children}
        </Telegram.Text>
      );
    }`}
${when(platforms.includes('line'))`
    if (platform === 'line') {${when(platforms.includes('webview'))`
      const liffLink = \`https://liff.line.me/\${lineLiffId}\`;`}
      return (
        <Line.ButtonTemplate
          altText={(template) => template.text}
          actions={${`${when(platforms.includes('webview'))`
            <>`}
              <Line.PostbackAction
                label={aboutText}
                displayText={aboutText}
                data={aboutData}
              />${when(platforms.includes('webview'))`
              <Line.UriAction label={webviewText} uri={liffLink} />
            </>`}
          `}}
        >
          {children}
        </Line.ButtonTemplate>
      );
    }`}

    return (
      <p>
        {children}${when(platforms.includes('webview'))`
        <br />
        Open Webview: https://{domain}/webview`}
      </p>
    );
  };



export default ${
    platforms.includes('webview')
      ? `makeContainer({
  deps: [
    ServerDomain,${when(platforms.includes('line'))`
    LineLiffId,`}
  ],
})(WithMenu);`
      : `WithMenu;`
  }
`);
