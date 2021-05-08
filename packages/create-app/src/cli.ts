#!/usr/bin/env node
import { resolve as resolvePath } from 'path';
import meow from 'meow';
import createApp from './createApp';

const cli = meow(
  `
Usage
  $ create-machinat-app -p <platform> [-p <platform> ...] <project-path>

Options
  --platform, -p  platform modules to install, currently support 'messenger', 'telegram', 'line', and 'webview'
  --name, -n   the app name, default to the name of project directory

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
    },
  }
);

const [projectInput] = cli.input;
if (!projectInput) {
  console.log(`please insert the project name`);
  process.exit(1);
}

const projectPath = resolvePath(projectInput);
const platforms = cli.flags.platform;

createApp({ platforms, projectPath }).then((code) => process.exit(code));
