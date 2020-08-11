import Machinat from '@machinat/core';
import ExpressionWithFoxButton from './ExpressionWithFoxButton';

const Hello = ({ name }) => {
  return (
    <ExpressionWithFoxButton buttonTitle="🦊💕">
      <p>
        Hello {name}!
        <br />
        Do you like fox?
      </p>
    </ExpressionWithFoxButton>
  );
};

export default Hello;
