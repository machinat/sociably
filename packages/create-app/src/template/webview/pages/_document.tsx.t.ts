import { when } from '../../../utils';
import { CreateAppContext } from '../../../types';

export default ({ platforms }: CreateAppContext): string => when(
  platforms.includes('webview')
)`
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
`;
