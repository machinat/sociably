#!/usr/bin/env node
import { resolve as resolvePath } from 'path';
import meow from 'meow';
import createApp from './createApp';

const cli = meow(
  `
Usage
  $ create-machinat-app -p <platform> [-p <platform> ...] <project-path>

Options
  -p, --platform   platforms to install; supported platforms: messenger, telegram, line, webview
  -n, --name,      the app name (default: project dir name)
  -r, --recognizer the intent recognition provider; regex or dialogflow (default: regex)

Example
  $ create-machinat-app -p messenger -p webview
`,
  {
    flags: {
      platform: {
        type: 'string',
        alias: 'p',
        isRequired: true,
        isMultiple: true,
      },
      name: {
        type: 'string',
        alias: 'n',
      },
      recognizer: {
        type: 'string',
        alias: 'r',
        default: 'regex',
      },
    },
  }
);

const [projectInput] = cli.input;
if (!projectInput) {
  console.log(`please insert the project name`);
  process.exit(1);
}

const projectPath = resolvePath(projectInput);
const { recognizer, platform: platforms } = cli.flags;

createApp({ platforms, projectPath, recognizer }).then((code) =>
  process.exit(code)
);
