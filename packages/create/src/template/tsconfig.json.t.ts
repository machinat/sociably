import { polishFileContent } from '../templateHelper';

export default () =>
  polishFileContent(`
{
  "include": ["./src/**/*"],
  "exclude": ["./src/webview/**/*"],
  "compilerOptions": {
    "outDir": "./lib",
    "lib": ["es2018"],
    "module": "commonjs",
    "target": "es2018",
    "strictNullChecks": true,
    "esModuleInterop": true,
    "jsx": "react",
    "jsxFactory": "Machinat.createElement",
    "jsxFragmentFactory": "Machinat.Fragment",
    "skipLibCheck": true,
    "noUnusedLocals": true,
    "composite": true,
    "declaration": true,
    "sourceMap": true,
    "types": ["node"],
    "rootDir": "./src",
    "outDir": "./lib"
  }
}
`);
