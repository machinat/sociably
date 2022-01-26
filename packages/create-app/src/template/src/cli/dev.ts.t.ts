export const mode = 0o775;

export default () => `
#!/usr/bin/env node
import { parse as parseUrl } from 'url';
import localtunnel from 'localtunnel';
import nodemon from 'nodemon';

const { PORT, DEV_TUNNEL_SUBDOMAIN } = process.env;

async function connectTunnel() {
  const tunnel = await localtunnel({
    port: PORT,
    host: 'https://t.machinat.dev',
    subdomain: DEV_TUNNEL_SUBDOMAIN,
  });

  if (
    parseUrl(tunnel.url).hostname !== \`\${DEV_TUNNEL_SUBDOMAIN}.t.machinat.dev\`
  ) {
    console.log(
      \`[dev:tunnel] Error: subdomain "\${DEV_TUNNEL_SUBDOMAIN}" is not available, please try later or change the subdomain setting (need rerun migrations)\`
    );
    tunnel.close();
    process.exit(1);
  }

  console.log(
    \`[dev:tunnel] Tunnel from \${tunnel.url} to http://localhost:\${PORT} is opened\`
  );

  tunnel.on('close', () => {
    console.log(
      \`[dev:tunnel] Tunnel from \${tunnel.url} to http://localhost:\${PORT} is closed\`
    );
  });

  return tunnel;
}

async function dev() {
  // create a https tunnel to localhost
  let tunnel = await connectTunnel();

  process
    .on('exit', (code) => {
      nodemon.emit('quit');
      tunnel.close();
      process.exit(code);
    })
    .on('SIGINT', () => {
      nodemon.emit('quit');
      tunnel.close();
      process.exit(0);
    });

  // run server in watch mode
  nodemon({
    exec: './node_modules/.bin/ts-node',
    script: './src/index.ts',
    watch: './src',
    ext: 'ts,tsx',
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
`;
