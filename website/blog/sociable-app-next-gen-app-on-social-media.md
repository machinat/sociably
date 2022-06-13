---
title: "The Next-Gen App on Social Media"
date: 2022-06-01
authors:
  - name: Patrck Liu
    title: Author of Machinat.js
    url: https://github.com/lrills
    image_url: https://avatars.githubusercontent.com/u/7855890?s=96&v=4
tags: ["framework", "sociable app"]
keywords: ["machinat","chatbot","sociable app"]
---

> [Machinat.js](https://github.com/machinat/machinat) is the first programming framework that covers _Social Media, Chatbot and Web App_ at the same time. And this empowers us to make a brand new kind of app on social platforms...

<img src={require("./assets/Steve_Jobs_presents_iPhone.jpg").default} />

> <strong>＂Every once in a while a revolutionary product comes along that changes everything.＂</strong>
> <br/> &emsp; &emsp; <i>-- Steve Jobs, 2007</i>

This classic quote comes from the presentation of the [1st-gen iPhone](https://en.wikipedia.org/wiki/IPhone_(1st_generation)). From then on, mobile apps have totally changed everything in our lives. Such the revolutions of software happen about every decade:

In the 1980s, most apps were running in [command-line](https://en.wikipedia.org/wiki/Command-line_interface).  
In the 1990s, the [desktop app](https://en.wikipedia.org/wiki/Application_software) shaped the modern software in GUI.  
In the 2000s, the [web app](https://en.wikipedia.org/wiki/Web_application) delivered software as online services.  
In the 2010s, the [mobile app](https://en.wikipedia.org/wiki/Mobile_app) brought software along our side.

But after the mobile app wave, we've kept asking: **What is the next-gen app?**
From Chatbot to VR to Web3, several technology hypes have passed, but none of them became a phenomenon.
Today, in 2022, it's still a mystery.

## Social Media Age

However, one thing is certain: everything is on the social media now. We know the revolution of apps always comes after the prosperity of platforms. This has happened on PC, Web and mobile devices. And social media is the hottest platform today.

<img src={require("./assets/social-media-status-2022-4.png").default} />

> <small>Social media is dominant and still fast growing - <i>DataReportal (2022), <a href="https://datareportal.com/reports/digital-2022-global-overview-report">“Digital 2022: Global Overview Report”</a></i></small>

Remember the days that every business/organization/campaign built their own apps?
People [just don't download such various apps](https://techcrunch.com/2017/08/25/majority-of-u-s-consumers-still-download-zero-apps-per-month-says-comscore/), instead, a few social media only.
While our time and attention continuously move to social platforms, so do all kinds of businesses and services as well.

But how can we build software on the social media?

### Apps on Social Platforms?

We've actually tried shipping automated services on the instant messaging, that's the [Chatbot](https://en.wikipedia.org/wiki/Chatbot).
Its future seemed to be bright since the chat platforms is so popular.
Unfortunately, it finally failed because of:

- **Lack of programmatic features**. Most bots only provide little static content.
- **Poor user experiences**. It's hard to optimize chatting UI/UX.
- **Messaging UI is limited**. So they can't provide complicated features as in GUI.
- **No social media support**. Chatbots only work on chat platforms.
- **No standard UI**. So the development ecosystem failed to grow.

The problem is how do we made these bots:

<img height={500} src={require("./assets/no-code-tools.png").default} />

> <small>Popular tools for chatbot: BotFramework(↖), DialogFlow(↗), BotPress(↙) and Rasa(↘).</small>

These no-code tools have only so limited and inflexible functions that caused the problems above.
If you look at history, it's almost impossible make useful software without programming logic.
However, if we do have a programming solution that fix these issues,
it could be the key to the next-gen app.

That's the reason I spend last 3 years developing the [Machinat.js](https://github.com/machinat/machinat) framework, which brings a brand new way to make apps on social platforms.

I call it _Sociable App_.

## Sociable App = Social Media + Chatbots + Web App

A sociable app does these works seamlessly:

- Managing social media accounts
- Communicating to users as a chatbot
- Shipping features in an extended web app

So it's not only a chatbot, a web app or an automated social account.
It combines them all in one app that provides even better user experiences.

Below, I'll show you how it works with [a sociable Wordle game](https://twitter.com/WordleMachina).

### Enter from Social Media

The original Wordle has a problem: lack of an entry point.
A sociable app can manage its own social media accounts, which work as the entry of the app.

<video height={400} autoplay="autoplay" loop inline muted playsInline>
  <source src={require("./assets/wordle-social-media.mp4").default} type="video/mp4" />
</video>

> <small>Users can access the app and use it on Twitter.</small>

On social media, it can promote a campaign, interact with users and serve community-oriented features.

<img width={300} src={require("./assets/wordle-like.png").default} />

> <small>The app can do social media operations directly</small>

This solves the traffic source issue of web apps. And it also means the app can market itself automatically.

### Communicate by Messaging

The app then points users to the private messaging chat, which is the core of the app.
It provides 1-on-1 services here with the most friendly UI, the human language.

<video height={400} autoplay="autoplay" loop inline muted playsInline>
  <source src={require("./assets/wordle-chat.mp4").default} type="video/mp4" />
</video>

> <small>The app serves statistics and notification features in chatroom</small>

In the chat, it can provide basic features like menus, guides and notifications.
Machinat has all the tools you need to build UI/UX in a chat, including rich message formats, chat flow and intent recognition.

### Advanced Features in Webviews

Then the app can open a webview to provide more complicated features in the chatroom.
In the example, it's the Wordle game itself.

<video height={400} autoplay="autoplay" loop inline muted playsInline>
  <source src={require("./assets/wordle-webview.mp4").default} type="video/mp4" />
</video>

> <small>Users play the game in a connected webview</small>

The webview can serve unlimited features and experience in GUI like a web app.
In addition, it's securely linked with the chatroom and you can smoothly switch between them.

Another common usage is extending the chat experiences,
like showing rich data or selecting complicated input.
Like in another example:

<video height={400} autoplay="autoplay" loop inline muted playsInline>
  <source src={require("./assets/pomo-settings.mp4").default} type="video/mp4" />
</video>

> <small>Update a form in a more visualized way</small>

### All Platforms, All Features

Moreover, all the utilities mentioned above are cross-platform.
This means everyone on social network can easily access your app.

<video height={400} autoplay="autoplay" loop inline muted playsInline>
  <source src={require("./assets/wordle-cross.mp4").default} type="video/mp4" />
</video>

> <small>The app is cross-platform that also works on Messenger, Telegram and LINE (in order)</small>

One issue for cross-platform apps is we often need to customize UI/UX and logic for each platform.
Such optimization can be easily done too.

<video height={400} autoplay="autoplay" loop inline muted playsInline>
  <source src={require("./assets/wordle-optimize.mp4").default} type="video/mp4" />
</video>

> <small>In Messenger, it requires one special step to notify after 24 hr</small>

Furthermore, Machinat.js can support all the features of all the platforms.
So we can always optimize user experiences using any native feature.

### One Integrated UI

Finally, the social media, the chatbot, the web app are integrated seamlessly.
Thus, sociable apps can ship a unified experience just as in one app.

<video height={400} autoplay="autoplay" loop inline muted playsInline>
  <source src={require("./assets/wordle-whole.mp4").default} type="video/mp4" />
</video>

> <small>The app works smoothly on Twitter</small>

Machinat.js integrates these mechanisms as one revolutionary UI.
It's _standardized, cross-platform and extensible_ so developers can easily build 3rd-party UIs, plugins and even platforms.
This make it possible for the ecosystem to grow together.

That's the key to the next-gen apps.

## The Impact

The UI revolutions before had not only changed the software, but also how everything works in our world.
We think sociable apps is going to make these new changes:

### The Revival of Lightweight Apps

Sociable apps are super easy to use, because:

- you don't need to download or log in
- you can access them on any device
- you use them by simply chatting

It's perfect for the lightweight apps that have once prospered on mobile devices.

<video height={400} autoplay="autoplay" loop inline muted playsInline>
  <source src={require("./assets/pomo-example.mp4").default} type="video/mp4" />
</video>

> <small>A pomodoro timer that is always available to you</small>

It may especially fit small games, informational apps and apps for an event/location/store.
These apps benefit from the social media traffic the most.

### Personification of Software

A sociable app can have its own image and personality on social media. It can be either original or linked to an existing character.

<video height={400} autoplay="autoplay" loop inline muted playsInline>
  <source src={require("./assets/holo-image.mp4").default} type="video/mp4" />
</video>

> <small><a href="https://github.com/lrills/HoloPomodoro">HoloPomodoro</a> is a pomodoro timer with VTuber image</small>

A well-designed image helps users to know it, recognize it and get closer to it.
This makes it like a real-life NPC.

### Automating Social Media

Businesses spend lots of human resources on social media today, mainly for marketing and customer services.
A sociable app can automate these works and save huge cost.

<video height={400} autoplay="autoplay" loop inline muted playsInline>
  <source src={require("./assets/cs-example.mp4").default} type="video/mp4" />
</video>

> <small>The sociable app naturally fits customer services</small>

It also enables some new strategies on social media, like a gamified experience.

<video height={400} autoplay="autoplay" loop inline muted playsInline>
  <source src={require("./assets/sm-example.mp4").default} type="video/mp4" />
</video>

> <small>A gamified marketing example</small>

And to a developer, since you always need to promote your app on social media, why don't you develop a sociable app at the beginning?

### The Omni-Channel App

In the future, Machinat.js will support every platform that uses human language.
That includes SMS, email, voice assistants and embedded chat in websites or mobile apps.

<img width={500} src={require("./assets/omni-channel.png").default} />

> <small>Sociable app can serve on all the media for communication</small>

Therefore, the marketing, sales and customer services can all be programmed into one app.
For example:

<video height={400} autoplay="autoplay" loop inline muted playsInline>
  <source src={require("./assets/travel-example.mp4").default} type="video/mp4" />
</video>

> <small>Integrating other services and apps smoothly</small>

This provides one unified user experience to the customers everywhere, which implements the [_omni-channel experience_](https://en.wikipedia.org/wiki/Omnichannel) automatically.

## Try It Today

Today, the environment is more ready than the days of chatbot hype.
Social media is even more popular.
Technologies like intent recognition are mature.
Platforms' support is complete since [Whatsapp finally opened the cloud API](https://developers.facebook.com/blog/post/2022/05/19/whatsapp-cloud-based-api/).
It's time for the revolution to happen.

Machinat.js makes it super easy to build sociable apps.
You can create an app with one command; run it and start developing in minutes; launch the app in merely one day.
It's the most efficient way to reach users in this social media age.

<img height={500} src={require("../static/img/start-dev.webp").default} />

> <small>Initiating a sociable app is super easy. The video is played in real time.</small>

For now we support 4 platforms: [Twitter](https://twitter.com/), [Messenger](https://www.messenger.com/), [Telegram](https://telegram.org/) and [LINE](https://line.me/).
We'll keep supporting more in the future,
and plan to cover all the mainstream platforms this year.

You can start your first app from [our tutorial](https://machinat.com/docs/learn/).

## Join Us

Our goal is to ship software on all social platforms.  
So apps can provide features in real life, everywhere, all around us.  
So they can ease the social media works and bring amazing new strategies.  
So they can serve in our most familiar way, like a close friend.

However, to push such a paradigm shift, it's not only about a framework.
It requires the whole ecosystem!

The more people join, whether to develop apps, packages or the framework itself, the more we can push this vision forward.
Imagine that an app can learn telling jokes by simply adding a component.
That can even possibly lead us to build better AI!

If you are a developer, you can find more resources on [the GitHub repo](https://github.com/machinat/machinat). And welcome to discuss anything on [our Discord server](https://discord.gg/emTAcH7aST). If you have a cool idea or any cooperation chances, mail me and let's see how to push it:
[`patrick.liu@machinat.com`](mailto:patrick.liu@machinat.com)

Happy coding the next-gen app!
