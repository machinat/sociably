import { makeClassProvider } from '@machinat/core/service';
import type {
  IntentRecognizer,
  DetectIntentResult,
  DetectTextOptions,
} from '@machinat/core/base/IntentRecognizer';
import { ConfigsI } from './interface';
import { RegexIntentRecognitionConfigs } from './types';

const SPECIAL_CHARACTER = '|&!?+-_.,;`\'"/()\\\\';
const specialCharacterMatcher = new RegExp(`[${SPECIAL_CHARACTER}]`, 'g');

export class RegexIntentRecognizer<Languages extends string>
  implements IntentRecognizer<null>
{
  defaultLanguage: string;
  private _matchersByLanguages: Map<string, Map<string, RegExp>>;

  constructor({
    recognitionData: { intents, defaultLanguage },
  }: RegexIntentRecognitionConfigs<Languages>) {
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
            `(${phrases
              .map((p) =>
                p
                  .toLowerCase()
                  .replace(specialCharacterMatcher, ' ')
                  .trim()
                  .replace(/\s+/g, `[${SPECIAL_CHARACTER}\\s]+`)
              )
              .join('|')})`,
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
  ): Promise<DetectIntentResult<null>> {
    const language = options?.language || this.defaultLanguage;
    const matchers = this._matchersByLanguages.get(language);
    if (!matchers) {
      throw new Error(`unsupported language ${language}`);
    }

    for (const [name, matcher] of matchers) {
      if (text.match(matcher)) {
        return {
          type: name,
          confidence: 1,
          payload: null,
        };
      }
    }

    return {
      type: undefined,
      confidence: 0,
      payload: null,
    };
  }
}

const RecognizerP = makeClassProvider({ deps: [ConfigsI] })(
  RegexIntentRecognizer
);
type RecognizerP<Languages extends string> = RegexIntentRecognizer<Languages>;

export default RecognizerP;
