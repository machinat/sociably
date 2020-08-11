import Machinat from '@machinat/core';
import FoxCard from './FoxCard';

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
    <>
      <p>{words}</p>
      <FoxCard />
    </>
  );
};

export default ReplyMessage;
