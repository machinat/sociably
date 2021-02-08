import * as fs from 'fs';

const pkgs = fs
  .readdirSync('./packages')
  .filter((pkg) => pkg !== 'jest-snapshot-serializer');

const exportPaths = pkgs
  .map((pkg) => {
    const { exports } = JSON.parse(
      fs.readFileSync(`./packages/${pkg}/package.json`, { encoding: 'utf8' })
    );

    return Object.values(exports).reduce((paths: string[], libPath: string) => {
      const srcPath = `./packages/${pkg}/src/${libPath.slice(6)}`;

      if (libPath.slice(-1) === '/') {
        const files = fs
          .readdirSync(srcPath)
          .filter((file) => file.slice(-3) === '.ts')
          .map((file) => srcPath + file);

        return [...paths, ...files];
      }

      return [...paths, `${srcPath.slice(0, -3)}.ts`];
    }, []);
  })
  .flat(1);

console.log(exportPaths.join(' '));
