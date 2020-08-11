# LINE Platform App Example

This example shows how to make a simple chatbot in LINE platform with Machinat.

## Prerequisite

The guide below expect you to have:

1. Node.js and `npm` (or `yarn`) installed.
2. [`ngrok`](https://ngrok.com/download) installed for HTTPS tunnel.
3. a LINE messaging API channel for the chatbot.

## Installation

1. Download this example:

```sh
curl https://codeload.github.com/machinat/machinat/tar.gz/master | tar -xz --strip=2 machinat-master/examples/line-platform
cd line-platform
```

2. Add an `.env` file at example folder and fill the following settings:

```sh
LINE_PROVIDER_ID=       # provider id
LINE_CHANNEL_ID=        # channel id
LINE_CHANNEL_SECRET=    # channel secret
LINE_ACCESS_TOKEN=      # channel access token
```

3. Create a http tunnel with [ngrok](https://ngrok.com/docs) in a separated terminal:

```sh
ngrok http 8080
```

4. Prepare and start app:

```sh
npm install
npm run build
npm start
# or with yarn
yarn
yarn run build
yarn start
```

5. At the LINE channel setting page, set up the webhook with the ngrok https tunnel url. The url should be like `https://xxxxxxxx.ngrok.io`

The chatbot should work in Messenger platform now.

## Feature of this Bot

The chatbots return random fluffy fox pictures. Thanks to the API from [randomfox.ca](https://randomfox.ca).
