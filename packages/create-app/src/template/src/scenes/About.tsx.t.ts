export default (): string => `
import Sociably, { serviceContainer } from '@sociably/core';
import { build } from '@sociably/script';
import * as $ from '@sociably/script/keywords';
import WithYesNoReplies from '../components/WithYesNoReplies'
import useIntent from '../services/useIntent'

type AboutVars = {
  isOk: boolean;
};

const ASK_YES_OR_NO = (key: string) => (
  <$.PROMPT<AboutVars>
    key={key}
    set={
      serviceContainer({ deps: [useIntent] })(
        (getIntent) => async (_, { event }) => {
          const intent = await getIntent(event);
          return { isOk: intent.type !== 'no' }
        }
      )
    }
  />
);

export default build<AboutVars>(
  {
    name: 'About',
    initVars: () => ({ isOk: true }),
  },
  <$.BLOCK<AboutVars>>
    {() => (
      <>
        <p>
          I'm generated by Sociably.js framework{'\\n\\n'}
          https://sociably.js.org
        </p>
        <Sociably.Pause time={1000} />
        <WithYesNoReplies>Do you need more info?</WithYesNoReplies>
      </>
    )}

    {ASK_YES_OR_NO('ask-more-info')}

    <$.IF<AboutVars> condition={({ vars }) => !vars.isOk }>
      <$.THEN>
        {() => <p>Ask me anytime!</p>}
        <$.RETURN />
      </$.THEN>
    </$.IF>
    
    {() => (
      <>
        <p>
          If you are new to Sociably, start from the tutorial to make your first
          app:{'\\n\\n'}
          https://sociably.js.org/docs/learn
        </p>
        <Sociably.Pause time={3000} />
        <p>
          You can find more features and guides in the documents:{'\\n\\n'}
          https://sociably.js.org/docs
        </p>
        <Sociably.Pause time={2000} />
        <WithYesNoReplies>Do these info help?</WithYesNoReplies>
      </>
    )}

    {ASK_YES_OR_NO('ask-feedback')}

    {({ vars }) => 
      vars.isOk 
        ? (
          <p>
            Thanks! Follow us to get more info:{'\\n\\n'}
            GitHub 😸{'\\n'}
            https://github.com/machinat/sociably{'\\n\\n'}
            Twitter 🐦{'\\n'}
            https://twitter.com/Sociablyjs
          </p>
        ) : (
          <p>
            Please help us to do better:{'\\n\\n'}
            Discussions 💬{'\\n'}
            https://github.com/machinat/sociably/discussions{'\\n\\n'}
            Report issues/bugs 🐞{'\\n'}
            https://github.com/machinat/sociably/issues/new
          </p>
        )
    }
  </$.BLOCK>
);
`;
