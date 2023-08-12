export default (): string => `
{
  "include": ["./src/**/*"],
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./lib",
    "lib": ["es2020"],
    "types": ["node"],
    "module": "Node16",
    "target": "es2020",
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
