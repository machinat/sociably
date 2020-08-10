import Machinat from '@machinat/core';
import WithFoxButton from './WithFoxButton';
import RandomFoxImage from './RandomFoxImage';

const ReplyMessage = ({ text, unknown, image }) => {
  let words;

  if (text) {
    words = /say/i.test(text)
      ? 'A-hee-ahee ha-hee'
      : /fox/i.test(text)
      ? '🦊🦊🦊'
      : `Cool! Here's your fox!`;
  } else if (image) {
    words = "That's cute! So does a fox!";
  } else if (unknown) {
    words = 'Do you mean a fox?';
  }

  return (
    <WithFoxButton>
      <p>{words}</p>
      <RandomFoxImage />
    </WithFoxButton>
  );
};

export default ReplyMessage;
