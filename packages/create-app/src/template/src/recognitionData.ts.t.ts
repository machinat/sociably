export default () => `
export default {
  defaultLanguage: 'en',
  languages: ['en'],
  intents: {
    greeting: {
      trainingPhrases: {
        en: [
          'hi',
          'yo',
          'hello',
          'hey',
          'hiya',
          'howdy',
          'hi there',
          'greetings',
          'long time no see',
          'lovely day',
          'hello there',
          'a good day',
        ],
      },
    },

    about: {
      trainingPhrases: {
        en: [
          'what',
          'how',
          "what's this?",
          'what the heck',
          'how can you help me?',
          'who are you?',
          'what can you do?',
          'what should I do',
          'about',
        ],
      },
    },

    yes: {
      trainingPhrases: {
        en: [
          'yes',
          'ok',
          'ya',
          'nice',
          'good',
          'cool',
          'fine',
          "I'd like to",
          'I love to',
        ],
      },
    },
    
    no: {
      trainingPhrases: {
        en: [
          'no',
          'nope',
          'sorry',
          'later',
          'maybe not',
          'maybe later',
          'not this time',
          'maybe next time',
          'no, thanks',
        ],
      },
    },
  },
};
`;
