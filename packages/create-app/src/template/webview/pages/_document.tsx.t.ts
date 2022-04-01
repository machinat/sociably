import { when } from '../../../utils';
import { CreateAppContext } from '../../../types';

export default ({ withWebview }: CreateAppContext): string => when(withWebview)`
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css"
        />
        <link rel="icon" href="/webview/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
`;
