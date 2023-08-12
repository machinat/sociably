#!/usr/bin/env node
import { resolve as resolvePath } from 'path';
import meow from 'meow';
import createApp from './createApp.js';
import type { PlatformType } from './types.js';

const cli = meow(
  `
Usage
  $ npm init @sociably/app -- -p <platform> [-p <platform> ...] <project-path>

Options
  -p, --platform   platform adaptors to install; supported: facebook, instagram, whatsapp, telegram, line
  -n, --name,      the app name (default: project dir name)
  -r, --recognizer the intent recognition provider; regex or dialogflow (default: regex)
  -w, --webview    install webview modules
  --npmTag         the npm tag to install the packages with (default: latest)

Example
  $ npm init @sociably/app -- -p facebook --webview
`,
  {
    flags: {
      platform: {
        type: 'string',
        shortFlag: 'p',
        isRequired: true,
        isMultiple: true,
      },
      name: {
        type: 'string',
        shortFlag: 'n',
      },
      webview: {
        type: 'boolean',
        shortFlag: 'w',
        default: false,
      },
      recognizer: {
        type: 'string',
        shortFlag: 'r',
        default: 'regex',
      },
      npmTag: {
        type: 'string',
      },
    },
    importMeta: import.meta,
  }
);

const [projectInput] = cli.input;
if (!projectInput) {
  console.log(`please insert the project name`);
  process.exit(1);
}

const projectPath = resolvePath(projectInput);
const {
  recognizer,
  npmTag,
  platform: platforms,
  webview: withWebview,
} = cli.flags;

createApp({
  platforms: platforms as PlatformType[],
  projectPath,
  recognizer,
  withWebview,
  npmTag,
}).then((code) => process.exit(code));
