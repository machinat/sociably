import { when } from '../../../utils';
import { CreateAppContext } from '../../../types';

export default ({ platforms, withWebview }: CreateAppContext): string => `
import Machinat, { MachinatNode } from '@machinat/core';${when(
  platforms.includes('messenger')
)`
import * as Messenger from '@machinat/messenger/components';${when(withWebview)`
import { WebviewButton as MessengerWebviewButton } from '@machinat/messenger/webview';`}`}${when(
  platforms.includes('twitter')
)`
import * as Twitter from '@machinat/twitter/components';${when(withWebview)`
import { WebviewButton as TwitterWebviewButton } from '@machinat/twitter/webview';`}`}${when(
  platforms.includes('telegram')
)`
import * as Telegram from '@machinat/telegram/components';${when(withWebview)`
import { WebviewButton as TelegramWebviewButton } from '@machinat/telegram/webview';`}`}${when(
  platforms.includes('line')
)`
import * as Line from '@machinat/line/components';${when(withWebview)`
import { WebviewAction as LineWebviewAction } from '@machinat/line/webview';`}`}

type WithMenuProps = {
  children: MachinatNode;
};

const WithMenu = ({ children }: WithMenuProps, { platform }) => {${when(
  withWebview
)`
  const webviewText = 'Open Webview ↗️';`}
  const aboutText = 'About ℹ';
  const aboutData = JSON.stringify({ action: 'about' });

${when(platforms.includes('messenger'))`
  if (platform === 'messenger') {
    return (
      <Messenger.ButtonTemplate
        buttons={${`${when(withWebview)`
          <>`}
            <Messenger.PostbackButton title={aboutText} payload={aboutData} />${when(
              withWebview
            )`
            <MessengerWebviewButton title={webviewText} />
          </>`}
        `}}
      >
        {children}
      </Messenger.ButtonTemplate>
    );
  }`}
${when(platforms.includes('twitter'))`
  if (platform === 'twitter') {
    return (
      <Twitter.DirectMessage${when(withWebview)`
        buttons={<TwitterWebviewButton label={webviewText} />}`}
        quickReplies={
          <Twitter.QuickReply label={aboutText} metadata={aboutData} />
        }
      >
        {children}
      </Twitter.DirectMessage>
    );
  }`}
${when(platforms.includes('telegram'))`
  if (platform === 'telegram') {
    return (
      <Telegram.Text
        replyMarkup={
          <Telegram.InlineKeyboard>
            <Telegram.CallbackButton text={aboutText} data={aboutData} />${when(
              withWebview
            )`
            <TelegramWebviewButton text={webviewText} />`}
          </Telegram.InlineKeyboard>
        }
      >
        {children}
      </Telegram.Text>
    );
  }`}
${when(platforms.includes('line'))`
  if (platform === 'line') {
    return (
      <Line.ButtonTemplate
        altText={(template) => template.text}
        actions={${`${when(withWebview)`
          <>`}
            <Line.PostbackAction
              label={aboutText}
              displayText={aboutText}
              data={aboutData}
            />${when(withWebview)`
            <LineWebviewAction label={webviewText} />
          </>`}
        `}}
      >
        {children}
      </Line.ButtonTemplate>
    );
  }`}

  return <p>{children}</p>;
};

export default WithMenu;
`;
