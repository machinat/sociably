---
slug: hola
title: The Next-Gen Conversational App
author: Patrick Liu
author_title: Machinat Author 
author_url: https://github.com/lrills
author_image_url: https://avatars1.githubusercontent.com/u/2053384?v=4
tags: [machinat, chatbot]
---

> tl;dr _Machinat_ is a JS framework to make cross-platform apps on social platforms. You can start from our [GitHub](https://github.com/machinat/machinat), [document](https://machinat.com/docs/) and [tutorial](https://machinat.com/docs/learn/). And we want to introduce you a brand new kind of app based on it.

<img width={600} src={require("./assets/Steve_Jobs_presents_iPhone.jpg").default} />

> <large><strong><i>＂ Every once in a while a revolutionary product comes along that changes everything. ＂</i></strong>
> <br/> &emsp; &emsp; <i>-- Steve Jobs, 2007</i></large>

 
Every 15 years, a new user interface come along and change the way we build software, from _mouse and desktop apps, to browser and website, to smart phone and mobile apps_. These revolutions had change our life style and how software works.

For now, it's 14 years after the iPhone presentation. But we are still looking for the answer to the question: 

__What's the next-gen app in the social media age?__

### The Chatbot Hype

Since about 2016, we've expected chatbot to be the answer. The future seemed to be bright since people are putting more time on social platforms (now historic high of [2h27m](https://www.slideshare.net/DataReportal/digital-2021-october-global-statshot-report-v03/59)). But till now, the paradigm shift we expect hasn't come yet.

So what's wrong? Most discussions point to the technology today is too far from real AI. But this could reveal a bigger issue: **Most bots merely try to chat, they don't provide useful features!** Users may come to chatbots because of curiosity, but soon leave because of gaining nothing.

#### Make Conversational Apps, not AI.

During the hype, the most successful bots are actually the simplest ones: bots for subscription. We've seen successful bots to subscribe information like promotion, news, campaign, or after-sale service. These bots don't need to be brilliant. They just provide simple and useful services.

An useful app is what we need everyday, not a fancy AI. And when it comes to apps, the advantages of chatbots still remain. They're **lightweight**, **easy to use/access** and **social platforms oriented**, which makes them perfect for some services. What we need is to find out a pattern to build apps around them.

### Conversational App Framework

Unlike AI, building apps is not an unknown challenge. Millions of apps have been built on different user interfaces. We can look back and learn from them.

<img style={{marginBottom:'-20px'}} width={600} src={require("./assets/historic-apps.png").default} />

> <i><small>Some of the most successful desktop apps, web apps and mobile apps.</small></i>

Though these apps are built for diverse purposes and different UI, these 3 conditions are always essential to make a successful app:

- **Programmable UI**:
  The best apps are built with programming language codes to provide the best features and experiences.
- **Cross-Platform**:
  The successful apps are cross-platform to reach more users and get financially success in business.
- **Shipping Features**:
  The great apps ship real features for their users, instead of only being fancy.

Machinat is designed for building conversational apps around these 3 concepts. For the following sections, I'll introduce how the framework helps on each aspect. And what would the next-gen apps be like based on them.

## Programmable UI

UI is the core of an app. For a conversational app, it mean __the messages in the chat__ and __the process of the conversation__. We'll refer to them as **chat UI** in later sections.

Chat UI was thought to be easier than GUI. But considering how much effort needed to learn a language, it could be actually opposite. From word/expression choices to the conversation logic, the variation in a chat can be no less than a graphical view. And moreover, our users are very sensitive about any detail of the language.

Luckily every developer is a experienced language speaker. What we need is a tool for them to program the chat.

### The No-code Tools?

Most popular tools for chatbots choose the [no-code](https://en.wikipedia.org/wiki/No-code_development_platform) solution. They often describe a chat in graphical diagrams or static data, like:

<img style={{marginBottom:'-20px'}} width={600} src={require("./assets/no-code-tools.png").default} />

> <i><small>Popular no-code tools for chatbot: BotFramework(↖), DialogFlow(↗), BotPress(↙) and Rasa(↘).</small></i>

But this way is totally not enough to handle the variation of the language, and stops us from building more complex features in chat. Because:

- The expression and the conversation are inflexible.
- It's hard to implement features in programming.
- Cannot reuse the chatting skill, style and logic.

That's why the no-code tools are mostly used to serve very limited content like blogs. Meanwhile good apps are always made by programming, which enables developers to flexibly build features and experiences.

Machinat use 2 techniques to make chat UI in codes: **Expression View** and the **Dialog Script**.

### Expression View

On instant messaging, we often use a series of messages for one expression. It may contain _text_ or _media_ messages, some _user actions_ and even some _pauses_. The chat is actually proceeded by each expression, and it should be the unit for chat UI.

In Machinat, an expression can be described in a [JSX](https://reactjs.org/docs/introducing-jsx.html) view, which represent a timeline of events. Here is an example of the expression view:
  
<div style={{width:'670px', overflow:'hidden', marginBottom:'-20px'}}>
  <video width={720} autoplay="autoplay" loop inline muted>
    <source src={require("./assets/expression-view.webm").default} type="video/webm" />
  </video>
</div>

> <i><small>Rendering the expression view in Messenger.</small></i>

Sending messages is therefore more like describing an detailed experience. Once the view is rendered, the framework will make sure the whole experience is delivered to the user. So you don't need to worry about calling lots of APIs anymore.  

#### Chat UI Component

As in [React.js](https://reacts.org), we can also modularize chat UI into a **JSX component**. A component is simply a function that returns a part of expression. Here's an example to make an expression with reusable components:

<div style={{width:'625px', overflow:'hidden', marginBottom:'-20px'}}>
  <video width={720} autoplay="autoplay" loop inline muted>
    <source src={require("./assets/component.webm").default} type="video/webm" />
  </video>
</div>

> <i><small>Rendering reusable components in Messenger.</small></i>

Component makes it possible to encapsulate the expression logic and reuse it. It keeps the codes [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) and meanwhile make sure the bot to have consistent chatting skills and styles. And in the future, 3rd-party components may largely simplify the works of making UI, as in the web front-end.

### Dialog Script

Another challenge to build chat UI/UX is the logic flow of a conversation. In Machinat, it can be described in a **dialog script** just like programming. Here is an example to ask questions in chat:

<div style={{width:'640px', overflow:'hidden', marginBottom:'-20px'}}>
  <video width={720} autoplay="autoplay" loop inline muted>
    <source src={require("./assets/dialog-script.webm").default} type="video/webm" />
  </video>
</div>

> <i><small>Executing a dialog script in Messenger.</small></i>

In the dialog script, you can use the familiar keywords like `IF`, `WHILE`, `RETURN` and `PROMPT` to control the dialog like coding. With the  programming logic, it's possible to make any dialog flow no matter how complex it is.

Furthermore, the conversation flow can also be modularized. You can `CALL` a script to reuse the flow in another script, like this:

<div style={{width:'550px', overflow:'hidden', marginBottom:'-20px'}}>
  <video width={720} autoplay="autoplay" loop inline muted>
    <source src={require("./assets/subscript.webm").default} type="video/webm" />
  </video>
</div>

> <i><small>Executing a nested dialog script in Messenger.</small></i>

While your app grows, it require more complex expressions, inputs and flows to provide more features. Building chat UI/UX in a descriptive and modular way is the key to enable an app to scale in production.

## Cross Platform

Today we uses average [6.7](https://www.slideshare.net/DataReportal/digital-2021-october-global-statshot-report-v03/59) social platforms to reach more people and information. For a conversational app, the situation is exactly the same. Running on more platforms not only _enlarge the user base_, but also _improve the user experience_ by serving on users' most used platform. Both are crucial for a successful app.

But the problem is the number of social platforms. Let's take a look at the most used social platforms:

<img style={{marginBottom:'-20px'}} width={600} src={require("./assets/social-platforms-rank.webp").default} />

> <cite><small>DataReportal (2021), “Digital 2021 October Global Statshot Report”, retrieved from https://datareportal.com/reports/digital-2021-october-global-statshot</small></cite>

In this rank, there are 11 social media and messaging apps that support conversational apps. There are more popular platforms within some regions or communities, like _LINE_, _Slack_ and _Discord_. And it should also count in the traditional _email, SMS_; the _embedded chat_ in websites or mobile apps; the _voice assistants_ as well.

The number of conversational platforms and the diversity between them make it really complex to build a cross-platform app. That's why we need a cross-platform framework.

### All Platforms and All Features

Because of the number, it's unlikely to make every version of each platform. But to support so many platforms in one program, the framework has 2 challenges to overcome:

- to build the app in a platform-agnostic way.
- to optimize user experience for each platform.

Most other tools may achieve the first by supporting only the common APIs like simple text messages. But you are not able to use other platform-specific features in this way, like some in-chat widgets. This causes them fail the second condition.

In Machinat, all the APIs are designed to achieve both. You can flexibly choose between two sets of APIs: the 
general interfaces for cross-platform features, and the native interfaces for one specific platform only.

<img style={{marginBottom:'-20px'}} width={500} src={require("./assets/api-types.png").default} />

> <i><small>Machinat framework API in different scopes.</small></i>

Combining both API reduces the complexity for building cross-platform experiences, at the same time, keeps the capability to use **all the features of all the platforms**. This is the core design concept of Machinat, and you can use this pattern everywhere in the framework.

### Cross-platform UI

One example is to build cross-platform chat UI in JSX. You can use two types of elements in an expression view:

- **General Elements** are common features that works on all platforms. For example, `<p>Hello World</p>` represent a paragraph and is rendered as a text bubble on messaging platforms.

- **Native Elements** are features for one specific platform. They include all the native expressive APIs, like `<Messenger.GenericTemplate>{...}</Messenger.GenericTemplate>`.

The general elements can be used as the base expression, then you can conditionally optimize it with native elements. Here is an example:

<div style={{width: '610px', overflow:'hidden', marginBottom:'-20px'}}>
  <video width={720} autoplay="autoplay" loop inline muted>
    <source src={require("./assets/cross-platform.webm").default} type="video/webm" />
  </video>
</div>

> <i><small>Render a cross-platform caht UI in Messenger and Telegram.</small></i>

The cross-platform logic can be encapsulated in the component, so you can reuse the UI no matter what platform it is.

## Shipping Features

Finally, the most important question might be: What features can we ship through the conversational apps?

While using chat UI, the interactions with users is limited by the conversation platforms. This restricts chatbots from shipping various features as mobile apps or web apps do. Meanwhile, lacking of a killer feature also stops users from migrating to the conversational apps.

We are going to reverse the disadvantages in two directions:
1. Extend the chat UI with GUI to ship more features.
2. Integrate all the platforms to provide an unique experience.

### Chat UI + GUI

Chat UI is never a replacement of GUI. But we can actually use both of them to provide even better experiences. In Machinat, a webview can be used in the chat to provide richer views and more complex interactions.

<div style={{width: '710px', overflow:'hidden', marginBottom:'-20px'}}>
  <video width={720} autoplay="autoplay" loop inline muted>
    <source src={require("./assets/webview.webm").default} type="video/webm" />
  </video>
</div>

> <i><small>Opening a cross-platform webview in the chat.</small></i>

The webview is not only a web page:

- It's linked with the chatroom to extend chat UX.
- It's automatically logged-in to safely serve private features.
- It's connected with the server to receive instant server pushes.
- It's cross-platform that require only a little setup.

The webview empowers conversational apps to achieve everything web apps can do. Such hybrid apps keeps the easy-to-use advantage of chat UI, while GUI can provide splendid features like games, dashboard, infinite scrolling views.

### Omni-channel App

Finally, there has to be a killer feature. The superpower of the conversational apps is to integrate all the social platforms and provide an integrated service. Here is a scenario:

> Users get to know a travel website on social media. They interact with the post and get a coupon that attract them to the website. An embedded chatbot in the website can guide them to plan the tour. After the purchase, users can check the trips/tickets, receive notifications and get assistance in the messaging app. During the tour, the bot can be invited into a group to share info with travel mates. After the tour, the bot can push other trip info and discounts to get users into another cycle.

Though the whole process happens on different platforms, but the users actually experience one continuous and consistent service. That's the idea of [omni-channel](https://en.wikipedia.org/wiki/Omnichannel) experience.

<img style={{marginBottom:'-20px'}} width={650} src={require("./assets/omni-channel.png").default} />

> <i><small>The omni-channel experience spectrum around the conversational app.</small></i>

A conversational app can work on all these communication channels as the pivot of the integration. Let's call an app that ships omni-channel experiences an **omni-channel app**. It can help businesses in the following aspects:

- Link marketing, sales and customer services together as an unified service.
- Make sure the business has identical image and style on every channel.
- Maximize the overall traffic by referring users between different channels.

The omni-channel experience is already widely adopted in marketing. Now the omni-channel apps can not only automate the marketing works, but also integrate all the customer experiences together to serve as a whole.

## The Next-Gen App

Back to the initial question, so what would the next-gen app be like based on these utilities?

Now we can build chat UI/UX modules in programming, so the apps can have consistent chatting skills, knowledge and personality. The apps interacts with users on many social platforms and provide an integrated services as the profession. All these enable software to act more like real people.

_The next-gen app is **Software as an Individual** in the social network._

For example, if software is a person, these things can happen:

- a shopping website can promote products on social media. 
- a dating app can personally provide advice and helps.
- a productivity tool can friendly remind your working process.
- a food ordering service can order for everyone in a group.
- a game character can inform you an update outside of the game.
- a streaming media can be like a friend who knows your preferences.

Software can provide many more features than before as an individual in the social network. Moreover, this phenomenally expand the user experiences that software can ship.

### Software as an Individual

> <large><i><strong>" If we want users to like our software, we should design it to behave like a likeable person. "</strong>
> <br/> &emsp; &emsp; -- Alan Cooper</i></large>

The conversational app can literally work as a close friend in the social network. This brand new user experience can means some huge advances for software:

#### Serve in users' most familiar way

Language is the interface everyone knows. A well designed conversational app can have almost **0 learning cost**. It's perfect for providing guides, support and any services that require low entry cost.

#### Be all around users

Today we connect to everything through the social platforms. A conversational app can work on almost all the platforms and devices we use. Wherever users need, they can find the app around them.

#### Actively reach users

Other kinds of app can only wait for being opened passively, but conversational apps can reach users actively. Conversational apps can attract users on social media and keep in touch through messaging platforms.

#### Transmit values in social network

Today countless services and info are transmitted through the social network. Software now can be a node in the network that directly ships value between people, communities and businesses. For example, to share content; to assist people in a group/community; to be an agent for services/products.

#### Hybrid of chat UI and GUI

A conversational app can open a webview in chat to extend features. Meanwhile, it can be embedded as a chat view in the websites or mobile apps. The hybrid experiences have the advantages of both chat UI and GUI, which make the apps more friendly and more useful at the same time.

### Potential Market

The booming of apps always comes along with the prosperity of software platform. We have seen that on computers and mobile phones. The social network now can be a brand new software platform. And it's becoming the most popular one.

<img style={{marginBottom:'-20px'}} width={600} src={require("./assets/social-media-status.webp").default} />

> <cite><small>DataReportal (2021), “Digital 2021 October Global Statshot Report”, retrieved from https://datareportal.com/reports/digital-2021-october-global-statshot</small></cite>

The number of active social media users is stunningly 4.45 billion now, which is even [twice than 2016](https://datareportal.com/reports/digital-2016-global-digital-overview). If we can attract 1% of people on social platforms, there will be **45 million** users base. It's not overstate at all, for instance, [Nike](https://www.instagram.com/nike/) has 182 million followers merely on Instagram.

Since every business spends lots of human resource on social media and customer services, the potential market can be large. Conversational apps can bring automation to this huge but highly manually driven market.

On the other hand, if 1% of mobile apps' [218 billion download](https://www.appannie.com/en/go/state-of-mobile-2021) shift to the conversational apps, it could be **2 billion** new visitors yearly. It's pretty likely since this is already the [trend of customer services](https://www.gartner.com/en/newsroom/press-releases/2021-01-12-gartner-predicts-80--of-customer-service-organization).

We can start from simple apps, like apps for brands, campaigns or locations. People are already tired of filling their phone with these apps. The conversational apps on social platforms can perfectly match both customers' and businesses' needs.

### From App to AI

Though AI is still the future, but conversational apps are the necessary midway. Because machine learning requires tons of data for training, it's better to [launch without ML first](https://developers.google.com/machine-learning/guides/rules-of-ml#rule_1_don%E2%80%99t_be_afraid_to_launch_a_product_without_machine_learning).

Machinat's goal is to empower developers to craft the modules of mind by scratch. We can gradually build up the speaking skills, knowledge and personality while making the apps. For example, to make an expression with higher level modules like:

```js
<WithContext lang="jp" emotion="excited">
  <Hello firstMeet name="Jojo" />
  <Joke type="cliché" />
  <AskForFeeback />
</WithContext>
```

Once we accumulate enough modules of human mind, we might be able to train the ML models with these patterns. Then the framework will work as the body that provide I/O, so the AI as mind can exist as _an person in the social network_, _a NPC in Metaverse_ or even _somebody in the real world_.

This all begins from the simple conversational apps. If more developers join, we are more likely to make smarter apps and finally approach the real AI.

## Resources

- [GitHub](https://github.com/machinat/machinat)
- [Tutorial](https://machinat.com/docs/learn/)
- [Document](https://machinat.com/docs/)
- Examples:
  - [Pomodoro](https://github.com/machinat/pomodoro-example) - a pomodoro timer.
  - [Note](https://github.com/machinat/note-example) - a simple note app.
  - [Todo](https://github.com/machinat/todo-example) - a simple todo list app.
  - [4digits game](https://github.com/machinat/4digits-example) - play 4digit game.

## FAQ

- How many platforms does Machinat support?

  As a minimum viable product, Machinat support 3 platforms (_Messenger, Telegram, LINE_) initially. But we hope to cover all the mainstream social platforms in the next year. You can vote for the developing order [here](https://github.com/machinat/machinat).

- How to detect intent in Machinat?

  We tend to support all the intent recognition services on the market first (now DialogFlow only). There will be modules and unified data interfaces to help you manage data, train models and detect intent. So you can painlessly switch between any service providers or you own models.

- Will there still be graphical tools?

  There might be a tool like the [Storybook](https://storybook.js.org/) first, which helps teams to exhibit chat UI and test it. Tools that makes UI like [iOS Storyboard](https://developer.apple.com/tutorials/app-dev-training/creating-a-storyboard-app) might have lower priority.

- Will the project run by enterprise or community?

  The framework will always be be open-sourced and welcome community to participate. But to maintain a framework that relates to so many external services, it requires constant and frequent updates. It might be better to have an enterprise to back it up. But we are open to any possibilities.

### Contact
