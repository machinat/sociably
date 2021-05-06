import { polishFileContent } from '../../../templateHelper';

export default () =>
  polishFileContent(`
import { config as configEnv } from 'dotenv';
import localtunnel from 'localtunnel';
import nodemon from 'nodemon';

configEnv();
const { PORT, DEV_TUNNEL_SUBDOMAIN } = process.env;

async function dev() {
  const tunnel = await localtunnel({
    port: PORT,
    host: 'https://t.machinat.dev',
    subdomain: DEV_TUNNEL_SUBDOMAIN,
  });
  
  process.on('SIGINT', () => {
    tunnel.close();
    process.exit();
  });

  console.log(\`HTTP tunnel from \${tunnel.url} to localhost:\${PORT} is opened\`);
  tunnel.on('close', () => {
    console.log(
      \`HTTP tunnel from \${tunnel.url} to localhost:\${PORT} is closed\`
    );
  });
  
  nodemon({
    exec: 'ts-node -r dotenv/config',
    script: './src/index.ts',
    watch: './src',
    ext: 'ts,tsx',
    ignore: ['./src/webview'],
    verbose: true,
  });
};

dev();
`);
