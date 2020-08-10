import Machinat from '@machinat/core';
import { Expression, QuickReply } from '@machinat/messenger/components';
import { GIMME_FOX_KEY } from '../constant';

const WithFoxReply = ({ replyTitle, children }) => {
  return (
    <Expression
      quickReplies={
        <QuickReply title={replyTitle || 'More'} payload={GIMME_FOX_KEY} />
      }
    >
      {children}
    </Expression>
  );
};

export default WithFoxReply;
