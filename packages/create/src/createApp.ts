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
}: CreateAppOptions): Promise<void> => {
  const projectName = basename(projectPath);

  // validate platforms
  for (const platform of platforms) {
    if (!supportedPlatforms.includes(platform)) {
      console.log(
        `"${platform}" is not a supported platform, only  'messenger', 'telegram', 'line', and 'webview' are available for now`
      );
      process.exit(1);
    }
  }

  const context: CreateAppContext = {
    projectName,
    platforms,
  };

  if (fileExistsSync(projectPath)) {
    console.log(`project directory ${projectPath} already exists`);
    process.exit(1);
  }

  const templateFiles: string[] = await thenifiedly.call(
    glob,
    `${__dirname}/template/**/*.t.+(ts|js)`,
    { dot: true }
  );

  // write file content
  await Promise.all(
    templateFiles.map(async (file) => {
      const relativeFilePath = relativePath(
        `${__dirname}/template`,
        file
      ).replace(/\.t\.[t|j]s$/, '');
      const targetPath = joinPath(projectPath, relativeFilePath);

      const { default: buildContent } = await import(file);
      const content = buildContent(context);

      if (content) {
        const targetDir = dirname(targetPath);
        if (!fileExistsSync(targetDir)) {
          await thenifiedly.call(mkdir, targetDir, { recursive: true });
        }

        const ext = extname(targetPath);
        await thenifiedly.call(
          writeFile,
          targetPath,
          ext === '.ts'
            ? formatCode(content, 'typescript')
            : ext === '.js'
            ? formatCode(content, 'babel')
            : ext === '.json'
            ? formatCode(content, 'json-stringify')
            : content
        );
      }
    })
  );

  const npmInstall = spawnChildProcess('npm', ['install'], {
    cwd: projectPath,
  });
  npmInstall.stdout.pipe(process.stdout);
  npmInstall.stderr.pipe(process.stderr);

  await thenifiedly.tillEvent('close', npmInstall);

  const gitInit = spawnChildProcess(
    'git init && git add . && git commit -m "Init project with Create Machinat App"',
    { cwd: projectPath, shell: true }
  );
  await thenifiedly.tillEvent('close', gitInit);
};

export default createMachinatApp;
