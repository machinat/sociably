export type PlatformType = 'messenger' | 'line' | 'telegram' | 'twitter';

export type CreateAppContext = {
  projectName: string;
  recognizer: 'regex' | 'dialogflow';
  withWebview: boolean;
  platforms: PlatformType[];
};
