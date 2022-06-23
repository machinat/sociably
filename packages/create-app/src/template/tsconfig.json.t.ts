export default (): string => `
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
    "jsxFactory": "Sociably.createElement",
    "jsxFragmentFactory": "Sociably.Fragment",
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "sourceMap": true
  }
}
`;
