import { polishFileContent } from '../../../utils';

export const mode = 0o775;

export default () =>
  polishFileContent(`
#!/usr/bin/env node
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

  console.log(
    \`[dev:tunnel] Tunnel from \${tunnel.url} to http://localhost:\${PORT} is opened\`
  );
  tunnel.on('close', () => {
    console.log(
      \`[dev:tunnel] Tunnel from \${tunnel.url} to http://localhost:\${PORT} is closed\`
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
  nodemon.on('start',  () => {
    console.log(\`[dev:server] Dev server is running on \${PORT} port\`);
  });
  nodemon.on('restart', (changes: string[]) => {
    console.log(\`[dev:server] Restarting server. File changed: \${changes.join(', ')}\`);
  });
}

dev();
`);
