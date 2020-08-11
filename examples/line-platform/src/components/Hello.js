import Machinat from '@machinat/core';
import {
  Expression,
  QuickReply,
  PostbackAction,
} from '@machinat/line/components';
import { GIMME_FOX_KEY } from '../constant';

const Hello = ({ name }) => {
  const buttonTitle = '🦊💕';

  return (
    <Expression
      quickReplies={
        <QuickReply
          action={
            <PostbackAction
              label={buttonTitle}
              text={buttonTitle}
              data={GIMME_FOX_KEY}
            />
          }
        />
      }
    >
      <p>
        Hello {name}!
        <br />
        Do you like fox?
      </p>
    </Expression>
  );
};

export default Hello;
