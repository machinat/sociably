# Messenger Platform App Example

This example shows how to make a simple chatbot in Messenger platform with Machinat.

## Prerequisite

The guide below expect you to have:

1. Node.js and `npm` (or `yarn`) installed.
2. [`ngrok`](https://ngrok.com/download) installed for HTTPS tunnel.
3. a Facebook page to work as the chatbot.
4. a Facebook app linked with the page on Messenger Platform.
5. a LINE messaging API channel for the chatbot.

## Installation

1. Download this example:

```sh
curl https://codeload.github.com/machinat/machinat/tar.gz/master | tar -xz --strip=2 machinat-master/examples/messenger-platform
cd messenger-platform
```

2. Add an `.env` file at example folder and fill the following settings:

```sh
MESSENGER_PAGE_ID=       # FB page id
MESSENGER_ACCESS_TOKEN=  # FB page access token
MESSENGER_APP_SECRET=    # FB app secret
MESSENGER_VERIFY_TOKEN=  # token for verifying Messenger webhook
LINE_PROVIDER_ID=        # LINE provider id
LINE_CHANNEL_ID=         # LINE channel id
LINE_CHANNEL_SECRET=     # LINE channel secret
LINE_ACCESS_TOKEN=       # LINE channel access token
```

3. Create a http tunnel with [ngrok](https://ngrok.com/docs) in a separated terminal:

```sh
ngrok http 8080
```

4. Prepare and start app:

```sh
npm install
npm run build
npm run setup
npm start
# or with yarn
yarn
yarn run build
yarn run setup
yarn start
```

5. Subscribe `messages` and `messaging_postbacks` events of the page at the Messenger setting in the Facebook app dashboard.

6. Set up the webhook url at the Messenger setting with these information:
  - The ngrok https tunnel url from step 3, it should be like `https://xxxxxxxx.ngrok.io/messenger`.
  - The verifying token set in step 2.

7. At the LINE channel setting page, set up the webhook with the ngrok https tunnel url. The url should be like `https://xxxxxxxx.ngrok.io/line`

The chatbot should work in Messenger platform now.

## Feature of this Bot

The chatbots return random fluffy fox pictures. Thanks to the API from [randomfox.ca](https://randomfox.ca).
