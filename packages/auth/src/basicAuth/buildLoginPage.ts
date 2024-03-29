type LoginPageOptions = {
  platformName: string;
  platformImageUrl: string;
  platformColor: string;
  appName?: string;
  appIconUrl?: string;
  chatLinkUrl: string;
  loginCodeDigits: number;
};

const buildLoginPage = ({
  platformName,
  platformColor,
  platformImageUrl,
  appName,
  appIconUrl,
  chatLinkUrl,
  loginCodeDigits,
}: LoginPageOptions): string => `
<!DOCTYPE html>
<html>
<head>
<title>${platformName} Webview Login</title>
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
  width: 90px;
  height: 90px;
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
#codeInput {
  width: 15rem;
  height: 2.8rem;
  font-family: monospace;
  font-size: 2.6rem;
  text-align: center;
  margin: 0.2rem 0 0.2rem;
  border: solid #bbb 2px;
  border-radius: 0.3rem;
}
#errorMsg {
  color: red;
}
.buttons { gap: 0.7rem }
.button {
  height: 3rem;
  margin: 0 5px;
  border: none;
  border-radius: 0.3rem;
  font-size: 1rem;
  font-weight: 600;
}
#login {
  background-color: ${platformColor};
  color: #fff;
  padding: 0 1.5rem;
}
#login:disabled {
  filter: brightness(70%);
}
.checkChat {
  text-decoration: none;
  background-color: #eee;
  color: #222;
  padding: 0 0.9rem;
}
</style>
</head>
<body>

<div class="flex center column container">
  <div class="flex center icons">
    <img alt="${platformName}" src="${platformImageUrl}" />${
  appIconUrl
    ? `
    <div class="x"></div>
    <img alt="${appName}" src="${appIconUrl}" />`
    : ''
}
  </div>
  <h1>${appName || ''}</h1>
  <div class="flex column">
    <label for="codeInput">Login code at ${platformName} chat:</label>
    <input id="codeInput" type="text" pattern="\\d*" />
    <div id="errorMsg"></div>
  </div>
  <div class="flex center buttons">
    <a href="${chatLinkUrl}" class="flex center button checkChat">
      <span>CHECK CHAT</span>
      <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 23 23" width="20">
        <path d="M0 0h24v24H0z" fill="none" />
        <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
      </svg>
    </a>
    <button id="login" class="button">LOG IN</button>
  </div>
</div>

<script>

const input = document.getElementById('codeInput');
const loginButton = document.getElementById('login');
const errorMessage = document.getElementById('errorMsg');

function checkCodeInput() {
  return /^[0-9]{${loginCodeDigits}}$/.test(input.value);
}

function verifyLoginCode() {
  loginButton.disabled = true;

  if (!input.value) {
    errorMessage.innerText = '⨯ login code is empty';
    errorMessage.hidden = false;
  } else if (checkCodeInput()) {
    fetch('./verify', {
      method: 'POST',
      body: JSON.stringify({ code: input.value }),
    })
      .then(response => response.json())
      .then(result => {
        if (result.ok || result.retryChances === 0) {
          window.location = result.redirectTo;
        } else {
          errorMessage.innerText = '⨯ invalid login code';
          errorMessage.hidden = false;
        }
      });
  }
}

loginButton.addEventListener('click', () => {
  verifyLoginCode();
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    verifyLoginCode();
  }
});

input.addEventListener('input', () => {
  errorMessage.hidden = true;
  loginButton.disabled = false;
});

input.addEventListener('change', () => {
  if (!checkCodeInput()) {
    errorMessage.innerText = '⨯ login code is a ${loginCodeDigits} digits number';
    errorMessage.hidden = false;
    loginButton.disabled = true;
  }
});

</script>
</body>
</html>
`;

export default buildLoginPage;
