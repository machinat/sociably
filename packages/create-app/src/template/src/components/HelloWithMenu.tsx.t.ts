import { when } from '../../../utils.js';
import { CreateAppContext } from '../../../types.js';

export default ({ platforms, withWebview }: CreateAppContext): string => `
import Sociably, { SociablyNode } from '@sociably/core';${when(
  platforms.includes('facebook'),
)`
import * as Facebook from '@sociably/facebook/components';${when(withWebview)`
import { WebviewButton as FacebookWebviewButton } from '@sociably/facebook/webview';`}`}${when(
  platforms.includes('instagram'),
)`
import * as Instagram from '@sociably/instagram/components';${when(withWebview)`
import { WebviewButton as InstagramWebviewButton } from '@sociably/instagram/webview';`}`}${when(
  platforms.includes('whatsapp'),
)`
import * as WhatsApp from '@sociably/whatsapp/components';`}${when(
  platforms.includes('twitter'),
)`
import * as Twitter from '@sociably/twitter/components';${when(withWebview)`
import { WebviewButton as TwitterWebviewButton } from '@sociably/twitter/webview';`}`}${when(
  platforms.includes('telegram'),
)`
import * as Telegram from '@sociably/telegram/components';${when(withWebview)`
import { WebviewButton as TelegramWebviewButton } from '@sociably/telegram/webview';`}`}${when(
  platforms.includes('line'),
)`
import * as Line from '@sociably/line/components';${when(withWebview)`
import { WebviewAction as LineWebviewAction } from '@sociably/line/webview';`}`}


type HelloWithMenuProps = {
  target: string;
};

const HelloWithMenu = ({ target }: HelloWithMenuProps, { platform }) => {${when(
  withWebview,
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
              withWebview,
            )`
            <FacebookWebviewButton title={webviewText} />
          </>`}
        `}}
      >
        Hello {target}!
      </Facebook.ButtonTemplate>
    );
  }`}
  ${when(platforms.includes('instagram'))`
  if (platform === "instagram") {
    return (
      <Instagram.GenericTemplate>
        <Instagram.GenericItem
          title={\`Hello \${target}!\`}
          buttons={${`${when(withWebview)`
            <>`}
              <Instagram.PostbackButton title={aboutText} payload={aboutData} />${when(
                withWebview,
              )`
              <InstagramWebviewButton title={webviewText} />
            </>`}
          `}}
        />
      </Instagram.GenericTemplate>
    );
  }`}
  ${when(platforms.includes('whatsapp'))`
  if (platform === "whatsapp") {
    return (
      <WhatsApp.PredefinedTemplate
        name="hello_world_example"
        language="en"
        bodyParams={<WhatsApp.TextParam>{target}</WhatsApp.TextParam>}
        buttonParams={${`${when(withWebview)`
          <>`}
            <WhatsApp.QuickReplyParam payload={aboutData} />${when(withWebview)`
            <WhatsAppWebviewButtonParam />
          </>`}
        `}}
      />
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
        {text}
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
              withWebview,
            )`
            <TelegramWebviewButton text={webviewText} />`}
          </Telegram.InlineKeyboard>
        }
      >
        Hello {target}!
      </Telegram.Text>
    );
  }`}
${when(platforms.includes('line'))`
  if (platform === 'line') {
    return (
      <Line.ButtonTemplate
        text={\`Hello \${target}!\`}
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
      />
    );
  }`}

  return <p>Hello <b>{target}</b>!</p>;
};

export default HelloWithMenu;
`;
