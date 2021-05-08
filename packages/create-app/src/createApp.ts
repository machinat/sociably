import {
  relative as relativePath,
  join as joinPath,
  basename,
  dirname,
  extname,
} from 'path';
import { writeFile, existsSync as fileExistsSync, mkdir } from 'fs';
import { spawn as spawnChildProcess } from 'child_process';
import glob from 'glob';
import chalk from 'chalk';
import thenifiedly from 'thenifiedly';
import { format as prettierFormat, Options as PrettierOptions } from 'prettier';
import type { CreateAppContext } from './types';

const formatCode = (code: string, parser: PrettierOptions['parser']) =>
  prettierFormat(code, { parser, singleQuote: true });

const supportedPlatforms = ['messenger', 'telegram', 'line', 'webview'];

type CreateAppOptions = {
  platforms: string[];
  projectPath: string;
};

const createMachinatApp = async ({
  platforms,
  projectPath,
}: CreateAppOptions): Promise<number> => {
  console.log(
    `Create a ${chalk.yellow('Machinat')} app in ${chalk.green(
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
        )} "${platform}" is not a supported platform, only  'messenger', 'telegram', 'line', and 'webview' are supported for now`
      );
      return 1;
    }
  }

  const context: CreateAppContext = {
    projectName,
    platforms,
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
    `${__dirname}/template/**/*.t.+(ts|js)`,
    { dot: true }
  );

  // write file content
  await Promise.all(
    templateFiles.map(async (file) => {
      const targetPath = joinPath(
        projectPath,
        relativePath(joinPath(__dirname, 'template'), file).replace(
          /\.t\.[t|j]s$/,
          ''
        )
      );

      const { default: buildContent, mode, name } = await import(file);
      const content = buildContent(context);

      if (content) {
        const targetDir = dirname(targetPath);
        if (!fileExistsSync(targetDir)) {
          await thenifiedly.call(mkdir, targetDir, { recursive: true });
        }

        const ext = extname(targetPath);
        await thenifiedly.call(
          writeFile,
          name ? joinPath(dirname(targetPath), name) : targetPath,
          ext === '.ts'
            ? formatCode(content, 'typescript')
            : ext === '.js'
            ? formatCode(content, 'babel')
            : ext === '.json'
            ? formatCode(content, 'json-stringify')
            : ext === '.md'
            ? formatCode(content, 'markdown')
            : content,
          { mode }
        );
      }
    })
  );

  console.log(
    `Install ${chalk.yellow('Machinat')} framwork and other dependencies...\n`
  );

  const npmInstallProcess = spawnChildProcess('npm', ['install'], {
    cwd: projectPath,
    stdio: 'inherit',
  });

  const installCode = await thenifiedly.tillEvent('close', npmInstallProcess);
  if (installCode !== 0) {
    return installCode;
  }

  console.log('\n');
  console.log(`Initiate ${chalk.cyan('git')}...\n`);

  const gitInitProcess = spawnChildProcess(
    'git init && git add . && git commit -m "Init project with Create Machinat App"',
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

export default createMachinatApp;
