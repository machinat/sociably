import { when } from '../../../utils';
import { CreateAppContext } from '../../../types';

export default ({ platforms, withWebview }: CreateAppContext): string => `
import Sociably, { SociablyNode } from '@sociably/core';${when(
  platforms.includes('facebook')
)`
import * as Facebook from '@sociably/facebook/components';${when(withWebview)`
import { WebviewButton as FacebookWebviewButton } from '@sociably/facebook/webview';`}`}${when(
  platforms.includes('twitter')
)`
import * as Twitter from '@sociably/twitter/components';${when(withWebview)`
import { WebviewButton as TwitterWebviewButton } from '@sociably/twitter/webview';`}`}${when(
  platforms.includes('telegram')
)`
import * as Telegram from '@sociably/telegram/components';${when(withWebview)`
import { WebviewButton as TelegramWebviewButton } from '@sociably/telegram/webview';`}`}${when(
  platforms.includes('line')
)`
import * as Line from '@sociably/line/components';${when(withWebview)`
import { WebviewAction as LineWebviewAction } from '@sociably/line/webview';`}`}

type WithMenuProps = {
  children: SociablyNode;
};

const WithMenu = ({ children }: WithMenuProps, { platform }) => {${when(
  withWebview
)`
  const webviewText = 'Open Webview ↗️';`}
  const aboutText = 'About ℹ';
  const aboutData = JSON.stringify({ action: 'about' });

${when(platforms.includes('facebook'))`
  if (platform === 'facebook') {
    return (
      <Facebook.ButtonTemplate
        buttons={${`${when(withWebview)`
          <>`}
            <Facebook.PostbackButton title={aboutText} payload={aboutData} />${when(
              withWebview
            )`
            <FacebookWebviewButton title={webviewText} />
          </>`}
        `}}
      >
        {children}
      </Facebook.ButtonTemplate>
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
