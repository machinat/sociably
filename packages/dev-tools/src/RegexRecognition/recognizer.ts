import { serviceProviderClass } from '@sociably/core/service';
import type {
  RecognitionData,
  IntentRecognizer,
  DetectIntentResult,
  DetectTextOptions,
} from '@sociably/core/base/IntentRecognizer';
import { ConfigsI } from './interface.js';
import { RegexRecognitionConfigs } from './types.js';

const SPECIAL_CHARACTER = '&!?+\\-_.,;`\'"/';
const specialCharacterMatcher = new RegExp(`[${SPECIAL_CHARACTER}]`, 'g');

export class RegexIntentRecognizer<
  Recognition extends RecognitionData<string, string> = RecognitionData<
    string,
    string
  >,
> implements IntentRecognizer<Recognition, null>
{
  defaultLanguage: string;
  private _matchersByLanguages: Map<string, Map<string, RegExp>>;

  constructor({
    recognitionData: { intents, defaultLanguage },
  }: Recognition extends RecognitionData<infer Language, infer Intent>
    ? RegexRecognitionConfigs<Language, Intent>
    : never) {
    this.defaultLanguage = defaultLanguage;
    this._matchersByLanguages = new Map();

    Object.entries(intents).forEach(([name, { trainingPhrases }]) => {
      Object.entries<string[]>(trainingPhrases).forEach(([lang, phrases]) => {
        let matchers = this._matchersByLanguages.get(lang);
        if (!matchers) {
          matchers = new Map();
          this._matchersByLanguages.set(lang, matchers);
        }

        matchers.set(
          name,
          new RegExp(
            `(^|[${SPECIAL_CHARACTER}\\s])(${phrases
              .map((p) =>
                p
                  .toLowerCase()
                  .replace(specialCharacterMatcher, ' ')
                  .trim()
                  .replace(/\s+/g, `[${SPECIAL_CHARACTER}\\s]+`)
              )
              .join('|')})($|[${SPECIAL_CHARACTER}\\s])`,
            'i'
          )
        );
      });
    });
  }

  async detectText(
    _,
    text: string,
    options?: DetectTextOptions
  ): Promise<DetectIntentResult<Recognition, null>> {
    const language = options?.language || this.defaultLanguage;
    const matchers = this._matchersByLanguages.get(language);
    if (!matchers) {
      throw new Error(`unsupported language ${language}`);
    }

    for (const [name, matcher] of matchers) {
      if (text.match(matcher)) {
        return {
          type: name,
          language,
          confidence: 1,
          payload: null,
        } as DetectIntentResult<Recognition, null>;
      }
    }

    return {
      type: undefined,
      language,
      confidence: 0,
      payload: null,
    } as DetectIntentResult<Recognition, null>;
  }
}

export default serviceProviderClass({ deps: [ConfigsI] })(
  RegexIntentRecognizer
);
