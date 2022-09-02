export type PlatformType = 'facebook' | 'line' | 'telegram' | 'twitter';

export type CreateAppContext = {
  projectName: string;
  recognizer: 'regex' | 'dialogflow';
  withWebview: boolean;
  platforms: PlatformType[];
};
