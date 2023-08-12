/* eslint-disable no-console */
import {
  relative as relativePath,
  join as joinPath,
  resolve as resolvePath,
  basename,
  dirname,
  extname,
} from 'path';
import { writeFile, copyFile, existsSync as fileExistsSync, mkdir } from 'fs';
import { spawn as spawnChildProcess } from 'child_process';
import glob from 'glob';
import chalk from 'chalk';
import thenifiedly from 'thenifiedly';
import prettier, { Options as PrettierOptions } from 'prettier';
import { polishFileContent } from './utils.js';
import type { CreateAppContext, PlatformType } from './types.js';

type CreateAppOptions = {
  platforms: PlatformType[];
  projectPath: string;
  recognizer: string;
  withWebview: boolean;
  npmTag?: string;
};

const formatCode = (code: string, parser: PrettierOptions['parser']) =>
  prettier.format(code, { parser, singleQuote: true });

const supportedPlatforms: PlatformType[] = [
  'facebook',
  'instagram',
  'whatsapp',
  // NOTE: close twitter until Account Activity API support is back
  // 'twitter',
  'telegram',
  'line',
];

const createSociablyApp = async ({
  platforms,
  projectPath,
  recognizer,
  withWebview,
  npmTag = 'latest',
}: CreateAppOptions): Promise<number> => {
  console.log(
    `Create a ${chalk.yellow('Sociably')} app in ${chalk.green(
      projectPath
    )}...\n`
  );
  const projectName = basename(projectPath);

  // validate platforms
  for (const platform of platforms) {
    if (!supportedPlatforms.includes(platform)) {
      console.log(
        `${chalk.redBright(
          'Error:'
        )} '${platform}' is not a supported platform, only ${supportedPlatforms
          .map((p) => `'${p}'`)
          .join(', ')} are supported now`
      );
      return 1;
    }
  }

  if (recognizer !== 'regex' && recognizer !== 'dialogflow') {
    console.log(
      `${chalk.redBright(
        'Error:'
      )} "${recognizer}" is not a supported recognizer, only 'regex' and 'dialogflow' are supported now`
    );
    return 1;
  }

  const context: CreateAppContext = {
    projectName,
    platforms,
    recognizer,
    withWebview,
  };

  if (fileExistsSync(projectPath)) {
    console.log(
      `${chalk.redBright('Error:')} project directory ${chalk.green(
        projectPath
      )} already exists`
    );
    return 1;
  }

  const templateFiles: string[] = await thenifiedly.call(
    glob,
    `${`${process.platform === 'win32' ? '' : '/'}${
      /file:\/{2,3}(.+)\/[^/]/.exec(import.meta.url)![1]
    }`}/template/**/*.t.+(ts|js)`,
    { nodir: true }
  );

  // write file content
  await Promise.all(
    templateFiles.map(async (file) => {
      const targetDir = dirname(
        joinPath(
          projectPath,
          relativePath(
            joinPath(
              `${process.platform === 'win32' ? '' : '/'}${
                /file:\/{2,3}(.+)\/[^/]/.exec(import.meta.url)![1]
              }`,
              'template'
            ),
            file
          )
        )
      );

      const templateJsName = file.replace(/\.ts$/, '.js');
      console.log(templateJsName);

      const {
        default: buildContent,
        mode,
        name,
        binary,
      } = await import(templateJsName);
      const targetName = name || basename(file).replace(/\.t\.[t|j]s$/, '');
      const targetPath = joinPath(targetDir, targetName);

      const content = polishFileContent(buildContent(context));
      if (!content) {
        return;
      }

      if (!fileExistsSync(targetDir)) {
        await thenifiedly.call(mkdir, targetDir, { recursive: true });
      }

      if (binary) {
        await thenifiedly.call(
          copyFile,
          joinPath(
            resolvePath(
              `${process.platform === 'win32' ? '' : '/'}${
                /file:\/{2,3}(.+)\/[^/]/.exec(import.meta.url)![1]
              }`,
              '..'
            ),
            'binaries',
            binary
          ),
          targetPath,
          mode
        );
      } else if (typeof content === 'string') {
        const ext = extname(targetPath);
        const prettifiedContent = await (ext === '.ts' || ext === '.tsx'
          ? formatCode(content, 'typescript')
          : ext === '.js' || ext === '.jsx'
          ? formatCode(content, 'babel')
          : ext === '.json'
          ? formatCode(content, 'json-stringify')
          : ext === '.md'
          ? formatCode(content, 'markdown')
          : content);
        await thenifiedly.call(writeFile, targetPath, prettifiedContent, {
          mode,
        });
      }
    })
  );

  console.log(
    `Install ${chalk.yellow('Sociably')} framework and other dependencies...\n`
  );

  const sociablyDeps = [
    '@sociably/core',
    '@sociably/http',
    '@sociably/dev-tools',
    '@sociably/redis-state',
    '@sociably/stream',
    '@sociably/script',
    withWebview ? '@sociably/webview' : undefined,
    platforms.includes('facebook') ? '@sociably/facebook' : undefined,
    platforms.includes('instagram') ? '@sociably/instagram' : undefined,
    platforms.includes('whatsapp') ? '@sociably/whatsapp' : undefined,
    platforms.includes('telegram') ? '@sociably/telegram' : undefined,
    platforms.includes('line') ? '@sociably/line' : undefined,
    recognizer === 'dialogflow' ? '@sociably/dialogflow' : undefined,
  ]
    .filter((pkgName) => !!pkgName)
    .map((pkgName) => `${pkgName}@${npmTag}`);

  const npmInstallProcess = spawnChildProcess(
    'npm',
    ['install', ...sociablyDeps],
    { cwd: projectPath, shell: true, stdio: 'inherit' }
  );

  const installCode = await thenifiedly.tillEvent('close', npmInstallProcess);
  if (installCode !== 0) {
    return installCode;
  }

  console.log('\n');
  console.log(`Initiate ${chalk.cyan('git')}...\n`);

  const gitInitProcess = spawnChildProcess(
    'git init && git add . && git commit -m "Init project with Create Sociably App"',
    { cwd: projectPath, shell: true, stdio: 'inherit' }
  );

  const gitInitCode = await thenifiedly.tillEvent('close', gitInitProcess);
  if (gitInitCode !== 0) {
    return gitInitCode;
  }

  console.log(`
${chalk.greenBright('Success!')} Created ${chalk.bold(
    projectName
  )} at ${chalk.green(projectPath)}
Inside that directory, you can run several commands:

  ${chalk.cyan('npm run dev')}
    Start the server in development mode.

  ${chalk.cyan('npm start')}
    Starts the server in production mode.

  ${chalk.cyan('npm run build')}
    Build the server and webview codes for deployment.

  ${chalk.cyan('npm run migrate')}
    Execute the migration jobs. Add '-- --down' to revert.

You have to fill chat platforms settings in ${chalk.green('.env')} file first.
Check the \`${chalk.bold('Environments Setup')}\` guide in ${chalk.green(
    'README.md'
  )}.
After that, you can begin by typing:

  ${chalk.cyan('cd')} ${projectName}
  ${chalk.cyan('npm run dev')}
`);

  return 0;
};

export default createSociablyApp;
