import { polishFileContent } from '../utils';

export default () =>
  polishFileContent(`
{
  "include": ["./src/**/*"],
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./lib",
    "lib": ["es2018"],
    "types": ["node"],
    "module": "commonjs",
    "target": "es2018",
    "jsx": "react",
    "jsxFactory": "Machinat.createElement",
    "jsxFragmentFactory": "Machinat.Fragment",
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "sourceMap": true
  }
}
`);
