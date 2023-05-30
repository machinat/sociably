import { REDIRECT_QUERY } from './constant.js';

type LoginPageOptions = {
  botName: string;
  callbackUrl: string;
  appName?: string;
  appIconUrl?: string;
};

const renderLoginPage = ({
  botName,
  callbackUrl,
  appName,
  appIconUrl,
}: LoginPageOptions): string => `
<!DOCTYPE html>
<html>
<head>
<title>Telegram Webview Login</title>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<meta charset="UTF-8">
<style>
body {
  margin:0;
  font-family: sans-serif;
}
.flex { display: flex }
.center {
  justify-content: center;
  align-items: center;
}
.column { flex-direction: column }
.container {
  width: 100vw;
  height: 100vh;
  gap: 1rem;
}
.icons { gap: 1.5rem }
img {
  width: 5.5rem;
  height: 5.5rem;
  object-fit: cover;
  border-radius: 0.5rem;
}
h1 {
  text-align: center;
}
.x {
  position: relative;
  margin-top: 1rem;
  height: 1rem;
  width: 1rem;
}
.x:before,
.x:after {
  position: absolute;
  content: '';
  width: 100%;
  height: 1.5px;
  background-color: black;
}
.x:before { transform: rotate(45deg) }
.x:after { transform: rotate(-45deg) }
</style>
</head>
<body>

<div class="flex center column container">
  <div class="flex center icons">
    <img alt="Telegram" src="https://sociably.js.org/img/icon/telegram.png" />${
      appIconUrl
        ? `
    <div class="x"></div>
    <img alt="${appName || ''}" src="${appIconUrl}" />`
        : ''
    }
  </div>
  <h1>${appName || ''}</h1>
  <div id="loginButton">
  </div>
</div>

<script>

const authUrl = new URL("${callbackUrl}");
const redirectQuery =
  new URL(window.location.href)
    .searchParams
    .get('${REDIRECT_QUERY}');

if (redirectQuery) {
  authUrl.searchParams.set('${REDIRECT_QUERY}', redirectQuery);
}

const loginScript = document.createElement('script');
loginScript.src = 'https://telegram.org/js/telegram-widget.js?18';
loginScript.setAttribute('async', '');
loginScript.setAttribute('data-telegram-login', '${botName}');
loginScript.setAttribute('data-size', 'large');
loginScript.setAttribute('data-radius', '20');
loginScript.setAttribute('data-auth-url', authUrl.href);
loginScript.setAttribute('data-request-access', 'write');

const button = document.getElementById('loginButton');
button.append(loginScript);

</script>
</body>
</html>
`;

export default renderLoginPage;
