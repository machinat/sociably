import Machinat from '@machinat/core';
import FoxCard from './FoxCard';

const ReplyText = ({ text }) => {
  const words = /say/i.test(text)
    ? 'A-hee-ahee ha-hee'
    : /fox/i.test(text)
    ? '🦊🦊🦊'
    : `That's right! Have a fox?`;

  return (
    <>
      <p>{words}</p>
      <FoxCard />
    </>
  );
};

export default ReplyText;
