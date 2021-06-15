import { polishFileContent } from '../utils';

export default () =>
  polishFileContent(`
{
  "include": ["./src/**/*"],
  "exclude": ["./src/webview/**/*"],
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
    "noUnusedLocals": true,
    "composite": true,
    "declaration": true,
    "sourceMap": true
  }
}
`);
