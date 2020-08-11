import Machinat from '@machinat/core';
import * as Messenger from '@machinat/messenger/components';
import * as Line from '@machinat/line/components';
import { GIMME_FOX_KEY } from '../constant';

const ExpressionWithFoxButton = ({ children, buttonTitle }, { platform }) =>
  platform === 'messenger' ? (
    <Messenger.Expression
      quickReplies={
        <Messenger.QuickReply title={buttonTitle} payload={GIMME_FOX_KEY} />
      }
    >
      {children}
    </Messenger.Expression>
  ) : platform === 'line' ? (
    <Line.Expression
      quickReplies={
        <Line.QuickReply
          action={
            <Line.PostbackAction
              label={buttonTitle}
              text={buttonTitle}
              data={GIMME_FOX_KEY}
            />
          }
        />
      }
    >
      {children}
    </Line.Expression>
  ) : (
    children
  );

export default ExpressionWithFoxButton;
