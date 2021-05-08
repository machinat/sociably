import { when, polishFileContent } from '../../../utils';
import { CreateAppContext } from '../../../types';

export default ({ platforms }: CreateAppContext) =>
  polishFileContent(when(platforms.includes('webview'))`
{
  "compilerOptions": {
    "target": "es5",
    "lib": [
      "dom",
      "dom.iterable",
      "es2018"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "noEmit": true
  },
  "include": [
    "**/*.ts",
    "**/*.tsx"
  ],
  "references": [
    { "path": "../../" }
  ],
  "exclude": [
    "node_modules"
  ]
}
`);
