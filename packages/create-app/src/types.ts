export type CreateAppContext = {
  projectName: string;
  recognizer: 'regex' | 'dialogflow';
  platforms: string[];
};
