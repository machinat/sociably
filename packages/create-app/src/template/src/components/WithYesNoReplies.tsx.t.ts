import { when } from '../../../utils';
import { CreateAppContext } from '../../../types';

export default ({ platforms }: CreateAppContext): string => `
import Sociably, { SociablyNode } from '@sociably/core';${when(
  platforms.includes('messenger')
)`
import * as Messenger from '@sociably/messenger/components';`}${when(
  platforms.includes('twitter')
)`
import * as Twitter from '@sociably/twitter/components';`}${when(
  platforms.includes('telegram')
)`
import * as Telegram from '@sociably/telegram/components';`}${when(
  platforms.includes('line')
)`
import * as Line from '@sociably/line/components';`}

type WithYesNoRepliesProps = {
  children: SociablyNode;
};

const WithYesNoReplies = (
  { children }: WithYesNoRepliesProps,
  { platform }
) => {
  const yesWords = 'Yes';
  const yesData = JSON.stringify({ action: 'yes' });
  const noWords = 'No';
  const noData = JSON.stringify({ action: 'no' });${when(
    platforms.includes('messenger')
  )`

  if (platform === 'messenger') {
    return (
      <Messenger.Expression
        quickReplies={
          <>
            <Messenger.TextReply title={yesWords} payload={yesData} />
            <Messenger.TextReply title={noWords} payload={noData} />
          </>
        }
      >
        {children}
      </Messenger.Expression>
    );
  }`}${when(platforms.includes('telegram'))`

  if (platform === 'telegram') {
    return (
      <Telegram.Expression
        replyMarkup={
          <Telegram.ReplyKeyboard oneTimeKeyboard resizeKeyboard>
            <Telegram.TextReply text={yesWords} />
            <Telegram.TextReply text={noWords} />
          </Telegram.ReplyKeyboard>
        }
      >
        {children}
      </Telegram.Expression>
    );
  }`}${when(platforms.includes('twitter'))`

  if (platform === 'twitter') {
    return (
      <Twitter.Expression
        quickReplies={
          <>
            <Twitter.QuickReply label={yesWords} metadata={yesData} />
            <Twitter.QuickReply label={noWords} metadata={noData} />
          </>
        }
      >
        {children}
      </Twitter.Expression>
    );
  }`}${when(platforms.includes('line'))`

  if (platform === 'line') {
    return (
      <Line.Expression
        quickReplies={
          <>
            <Line.QuickReply>
              <Line.PostbackAction
                displayText={yesWords}
                label={yesWords}
                data={yesData}
              />
            </Line.QuickReply>
            <Line.QuickReply>
              <Line.PostbackAction
                displayText={noWords}
                label={noWords}
                data={noData}
              />
            </Line.QuickReply>
          </>
        }
      >
        {children}
      </Line.Expression>
    );
  }`}

  return <>{children}</>;
};

export default WithYesNoReplies;
`;
