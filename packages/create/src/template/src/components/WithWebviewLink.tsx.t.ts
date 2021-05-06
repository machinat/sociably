import { when, polishFileContent } from '../../../templateHelper';
import { CreateAppContext } from '../../../types';

export default ({ platforms }: CreateAppContext) =>
  polishFileContent(when(platforms.includes('webview'))`
import Machinat, { MachinatNode, FunctionalComponent } from '@machinat/core';
import { makeContainer } from '@machinat/core/service';${when(
    platforms.includes('messenger')
  )`
import * as Messenger from '@machinat/messenger/components';`}${when(
    platforms.includes('telegram')
  )`
import * as Telegram from '@machinat/telegram/components';`}${when(
    platforms.includes('line')
  )`
import * as Line from '@machinat/line/components';`}
import { ServerDomain, LineLiffId } from '../interface';

type WithWebviewLinkProps = {
  children: MachinatNode;
};

export default makeContainer({
  deps: [
    ServerDomain,${when(platforms.includes('line'))`
    LineLiffId,`}
  ],
})(function WithWebviewLink(
  domain,${when(platforms.includes('line'))`
  lineLiffId`}
): FunctionalComponent<WithWebviewLinkProps> {
  return ({ children }, { platform }) => {
${when(platforms.includes('messenger'))`
    if (platform === 'messenger') {
      return (
        <Messenger.ButtonTemplate
          buttons={
            <Messenger.UrlButton
              title="Open Webview ↗️"
              url={\`https://\${domain}/webview?platform=messenger\`}
              messengerExtensions
            />
          }
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
              <Telegram.UrlButton
                login
                text="Open Webview ↗️"
                url={\`https://\${domain}/auth/telegram\`}
              />
            </Telegram.InlineKeyboard>
          }
        >
          {children}
        </Telegram.Text>
      );
    }`}
${when(platforms.includes('line'))`
    if (platform === 'line') {
      const liffLink = \`https://liff.line.me/\${lineLiffId}\`;
      return (
        <Line.ButtonTemplate
          defaultAction={<Line.UriAction uri={liffLink} />}
          altText={liffLink}
          actions={<Line.UriAction label="Open Webview ↗️" uri={liffLink} />}
        >
          {children}
        </Line.ButtonTemplate>
      );
    }`}

    return (
      <p>
        {children}
        <br />
        https://{domain}/webview
      </p>
    );
  };
});
`);
