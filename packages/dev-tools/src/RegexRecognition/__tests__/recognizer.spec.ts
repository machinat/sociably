import { RegexIntentRecognizer } from '../recognizer.js';

const thread = {
  platform: 'test',
  uid: 'john_doe',
};

const rocognizer = new RegexIntentRecognizer({
  recognitionData: {
    defaultLanguage: 'en',
    languages: ['en', 'zh-TW'],
    intents: {
      hello: {
        trainingPhrases: {
          en: ['Hello World', 'Hi Mark', 'May the force be with you'],
          'zh-TW': ['哈囉世界', '嗨馬克', '願原力與你同在'],
        },
      },
      fooBarBaz: {
        trainingPhrases: {
          en: ['Foo Bar Baz'],
          'zh-TW': ['富 爸 霸子'],
        },
      },
    },
  },
});

describe('.detectText()', () => {
  test.each([
    ['Hello, World!', 'hello', undefined],
    ['Hello? World!!?', 'hello', 'en'],
    ['Hi, Mark!', 'hello', undefined],
    ['MaY tHe FoRcE be With YOU', 'hello', 'en'],
    ['願原力與你同在!?', 'hello', 'zh-TW'],
    ['foo bar baz', 'fooBarBaz', undefined],
    ['foo-bar_baz', 'fooBarBaz', 'en'],
    ['`foo` \'bar\' "baz"', 'fooBarBaz', undefined],
    ['foo;bar&baz', 'fooBarBaz', 'en'],
    ['富-爸+霸子', 'fooBarBaz', 'zh-TW'],
  ])('match intent', async (text, expectedType, language) => {
    await expect(
      rocognizer.detectText(thread, text, { language })
    ).resolves.toEqual({
      type: expectedType,
      language: language || 'en',
      confidence: 1,
      payload: null,
    });
  });

  test('unmatched intent', async () => {
    await expect(rocognizer.detectText(thread, 'boooo')).resolves.toEqual({
      type: undefined,
      language: 'en',
      confidence: 0,
      payload: null,
    });
  });
});
