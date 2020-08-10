import Machinat from '@machinat/core';
import WithFoxButton from './WithFoxButton';

const Hello = ({ name }) => {
  return (
    <WithFoxButton replyTitle="🦊💕">
      <p>
        Hello {name}!
        <br />
        Do you like fox?
      </p>
    </WithFoxButton>
  );
};

export default Hello;
