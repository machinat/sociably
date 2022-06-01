---
title: "Sociable App: 屬於社群時代的 App"
date: 2022-06-01
authors:
  - name: Patrck Liu
    title: Author of Machinat.js
    url: https://github.com/lrills
    image_url: https://avatars.githubusercontent.com/u/7855890?s=96&v=4
tags: ["framework", "sociable app"]
keywords: ["machinat","chatbot","sociable app"]
---

> **tl;dr** Machinat.js 是一個在社群平台上打造 App 的程式框架。如果你想直接了解框架，可以從我們的 [GitHub](https://github.com/machinat/machinat)、[文件](https://machinat.com/docs/)及[課程](https://machinat.com/docs/learn/)開始。而這篇文章會介紹這如何在社群媒體上，帶來一種全新的 App 形式。

<img height={500} src={require("../blog/assets/Steve_Jobs_presents_iPhone.jpg").default} />

> <large><strong><i>＂Every once in a while a revolutionary product comes along that changes everything.＂</i></strong>
> <br/> &emsp; &emsp; <i>-- Steve Jobs, 2007</i></large>

從 1970 年代電腦進入我們的生活開始，每隔十年，總會出現一種全新的 app 形式。
而每次發生時，不僅僅改變我們使用軟體的方式，往往也影響了整個人類世界的運作。

1980 年代，大部分軟體仍運行在[命令列終端](https://zh.wikipedia.org/wiki/%E5%91%BD%E4%BB%A4%E8%A1%8C%E7%95%8C%E9%9D%A2)裡。  
1990 年代，[桌面應用程式](https://zh.wikipedia.org/zh-tw/%E5%BA%94%E7%94%A8%E7%A8%8B%E5%BA%8F)奠定了圖形化界面的軟體形式。  
2000 年代，[網路應用程式](https://zh.wikipedia.org/zh-tw/%E7%BD%91%E7%BB%9C%E5%BA%94%E7%94%A8%E7%A8%8B%E5%BA%8F)開啟了線上服務的概念。  
2010 年代，[行動應用程式](https://zh.wikipedia.org/zh-tw/%E6%B5%81%E5%8B%95%E6%87%89%E7%94%A8%E7%A8%8B%E5%BC%8F)讓我們能把軟體隨時帶在身邊。

但在 2022 年的今天，我們似乎仍無法回答：下一個世代的 app 會是什麼樣子？

## 大社群時代

但確定的是，現在全世界都圍繞著社群媒體運作。相比十年前，[我們幾乎不再下載新的行動 app 了](https://techcrunch.com/2017/08/25/majority-of-u-s-consumers-still-download-zero-apps-per-month-says-comscore/)，打開手機也只需要少少幾款社群軟體，人們的時間及注意力也都轉移到了社群平台上。

<img height={500} src={require("../blog/assets/social-media-status-2022-4.png").default} />

> <small>幾乎所有網路使用者都在社群平台上 - <i>DataReportal (2022), <a href="https://datareportal.com/reports/digital-2022-global-overview-report">“Digital 2022 April Global Statshot Report”</a></i></small>

記得曾經每個商家、活動、企業都會做一款自己的 app 嗎？現在大家已經不再下載這類的 app 了，而幾乎所有的行銷活動、新聞資訊、甚至大部分的服務，都是透過社群平台來跟大眾聯繫。

問題是程序化的 app 應該怎麼辦？

### 在社群平台上的 App？

幾年前的 [Chatbot](https://en.wikipedia.org/wiki/Chatbot) 熱潮裡，我們就曾嘗試在聊天平台上打造自動化的服務。但很快就不再有人使用這些機器人，因為他們：

- 只提供靜態的內容而非動態的功能。事實上大部分 bot 提供的功能根本少於一個靜態的網頁。
- 只在聊天平台上運作，而非所有的社群平台。但社群媒體的經營才是商業上最需要的。
- 只提供貧乏、缺少變化的體驗。沒有程式邏輯攘我們難以優化 UI/UX 的細節。
- 只在聊天室內用文字及有限的 UI 溝通。這讓 bot 難以像基於 GUI 的 app 一樣提供豐富的功能。

問題可能是我們建造 Chatbot 的方式:

<img height={500} src={require("../blog/assets/no-code-tools.png").default} />

> <i><small>主流的 chatbot 工具： BotFramework(↖), DialogFlow(↗), BotPress(↙) and Rasa(↘).</small></i>

這些無程式碼（no-code）工具功能有限且沒有使用上的彈性，這造成了上述 chatbot 的問題。沒有編程的邏輯，是不可能完成一個功能齊全、體驗良好的 “軟體” 的。這是為什麼我們需要一個程式框架來打造下一代的 app。

這驅使我花了三年打磨出一個程式框架 [Machinat.js](https://github.com/machinat/machinat)來解決這些問題，而在這之上誕生的新 app 形式，我稱之為 _Sociable App_。

## Sociable App = Social Media + Chatbots + Web App

Sociable App 能在社群平台上完成幾乎所有的工作：

- 經營自己的社群媒體帳號
- 在聊天平台上透過訊息提供服務
- 連結 web app 來提供圖形化的功能

它不僅僅是一個聊天機器人、一個網頁應用程式、一個自動的社群帳號。而是把這些都整合進一個 app 裡，並提供 1+1+1>3 的使用者體驗。

下面我會用一個[社群版的 Wordle](https://twitter.com/WordleMachina)，來說明 Social App 如何在社群平台上提供程式化的服務以及更好的體驗。

### 從社群媒體出發

原本的 Wordle 作為一個網頁程式有個缺陷：沒有一個方便的入口，僅能透過網址連結。
而 Sociable App 能經營自己的社群媒體帳號，讓廣大的社群用戶能容易找到並互動。

<video height={400} autoplay="autoplay" loop inline muted>
  <source src={require("../blog/assets/wordle-social-media.mp4").default} type="video/mp4" />
</video>

> <small>用戶可以輕易的在 Twitter 使用 app</small>

在社群媒體上，Sociable App 可以宣傳活動、與使用者互動、或直接面對社群提供服務。

<img width={300} src={require("../blog/assets/wordle-like.png").default} />

> <small>App 可以直接透過社群操作和使用者互動</small>

這不僅解決了網頁程式天生缺乏流量來源的問題，
也代表我們可以將行銷的工作編程進 app 裡自動完成。

### 透過訊息服務客戶

接著我們把使用者引導到聊天訊息裡，這是整個 app 運作的主體，透過淺顯易懂的對話介面提供一對一的服務。

<video height={400} autoplay="autoplay" loop inline muted>
  <source src={require("../blog/assets/wordle-chat.mp4").default} type="video/mp4" />
</video>

> <small>在聊天室裡檢視數據及啟用通知功能</small>

在聊天室裡我們可以提供基礎的功能，像選單、教學、通知，以及任何方便在對話中完成的服務。
Machinat.js 提供了所有打造聊天界面所需的工具，如豐富的訊息格式、對話流程、語意辨識等。


### 圖形化網頁界面

在聊天室裡 Sociable App 能打開一個網頁，在其中透過圖形化介面提供更複雜的功能。
範例裡，我們就能跟原版一樣在網頁遊玩 Wordle。

<video height={400} autoplay="autoplay" loop inline muted>
  <source src={require("../blog/assets/wordle-webview.mp4").default} type="video/mp4" />
</video>

> <small>在連結的網頁裡進行遊戲</small>

這讓 Sociable App 跟其他網頁應用程式一樣，可以透過畫面帶來各種功能與體驗。
同時網頁是與聊天室連結且自動登入的，我們還能兩者間無縫的切換。

另一個常見的用法是延伸聊天室的體驗，像是在網頁中呈現豐富的資料或更複雜的輸入。
如另一個範例：

<video height={400} autoplay="autoplay" loop inline muted>
  <source src={require("../blog/assets/pomo-settings.mp4").default} type="video/mp4" />
</video>

> <small>用視覺化的方式更新設定</small>

### 全平台 + 全功能

更重要的是，以上提到的所有功能都是跨平台支援的。所以 Sociable App 可以輕易的運行在所有的社群平台之上，這讓它可以接觸到更多更廣的使用者。

<video height={400} autoplay="autoplay" loop inline muted>
  <source src={require("../blog/assets/wordle-cross.mp4").default} type="video/mp4" />
</video>

> <small>相同功能在不同平台上的運作，依順序是 Messenger、Telegram、LINE</small>

由於每個社群平台間的差異太過巨大，所以我們常需要為每個平台訂製 UI/UX，甚至是流程邏輯。
Machinat.js 中幾乎所有的功能都支援這樣的客製化。

<video height={400} autoplay="autoplay" loop inline muted>
  <source src={require("../blog/assets/wordle-optimize.mp4").default} type="video/mp4" />
</video>

> <small>在 Messenger 上需要額外的步驟才能在 24 小時後通知</small>

除了能夠支援所有的平台，我們還會提供每個平台上的所有功能。
這讓我們可以針對每個平台最佳化，而不需要為了跨平台而犧牲用戶體驗。

### 組成完整的 App

最後，社群媒體、聊天機器人、網頁畫面，三者能夠流暢的整合在用戶體驗裡。
這讓我們能夠在任何社群平台上，提供一個近似於單一 app 的體驗。

<video height={400} autoplay="autoplay" loop inline muted>
  <source src={require("../blog/assets/wordle-whole.mp4").default} type="video/mp4" />
</video>

> <small>所有功能都可以無縫的嵌入在 Twitter 上</small>

我們把這些機制都成功整合在一起，成為一個支援所有社群平台的整合性 UI，這就是 Machinat.js 框架。
而這將會是大社群時代裡，通往的下一代 app 的關鍵。

## 對未來的影響

每次 app 的變革發生，不僅僅是改變我們建造軟體的方式，常常也改變了整個世界運作的模式。
我們相信 Sociable App 會帶來這些全新的改變：

### 輕量 App 重出江湖

Sociable App 的幾個特性：在所有的裝置上使用、不需要下載、打開即登入、透過語言溝通，讓使用者幾乎不需要任何成本就能上手，因此非常適合輕量的 app 提供簡單實用的服務。

<video height={400} autoplay="autoplay" loop inline muted>
  <source src={require("../blog/assets/pomo-example.mp4").default} type="video/mp4" />
</video>

> <small>一個隨手可得的蕃茄鐘 app</small>

尤其是小遊戲、資訊類、活動、商家相關的 app，本身就很依賴社群平台上的流量，更加適合直接用 Sociable App 提供服務。

### 軟體的擬人化

Sociable App 雖然是一個軟體，但可以在社群平台上擁有自己的形象與個性。
他既可以是原創的，也能連結到既有的角色與形象。

<video height={400} autoplay="autoplay" loop inline muted>
  <source src={require("../blog/assets/holo-image.mp4").default} type="video/mp4" />
</video>

> <small><a href="https://github.com/lrills/HoloPomodoro">HoloPomodoro</a> 是個用 VTuber 形象提供服務的蕃茄鐘</small>

一個精心打造的社群形象，可以幫助使用者更容易辨識、了解並親近，從而更願意持續的使用。
這讓 app 可以像是在現實世界的 NPC 一樣存在。

### 自動化社群平台操作

今天各個組織、企業都花相當多的人力在經營社群平台。Sociable App 可以自動化這些行銷及客服工作，即便只是部份，也能省下大量成本並讓工作更有效率。

<video height={400} autoplay="autoplay" loop inline muted>
  <source src={require("../blog/assets/cs-example.mp4").default} type="video/mp4" />
</video>

> <small>Sociable App 天生就適合用來提供客戶服務</small>

同時自動化的 app 也能帶來許多新的社群策略，譬如遊戲化的體驗。

<video height={400} autoplay="autoplay" loop inline muted>
  <source src={require("../blog/assets/sm-example.mp4").default} type="video/mp4" />
</video>

> <small>遊戲化的行銷體驗</small>

而對於一個開發者而言，你終究要在社群媒體上宣傳你的 app，那為什麼不一開始就開發一個 Sociable App 呢？

### 一切都是 App

未來 Machinat.js 會支援所有用語言溝通的平台，包括 SMS、email、語音助理、網頁/移動 app 裡的內嵌聊天室，都能透過同一個 app 整合在一起。

<img height={500} src={require("../blog/assets/omni-channel.png").default} />

> <small>Sociable App 可以包辦所有跟客戶聯繫的平台</small>

這代表 Sociable App 可以在任何地方提供全方位的服務，包括整個行銷、銷售、客服的流程，而使用者體驗就跟同一個 app 內一樣流暢。
如這個範例：

<video height={400} autoplay="autoplay" loop inline muted>
  <source src={require("../blog/assets/travel-example.mp4").default} type="video/mp4" />
</video>

> <small>Sociable App 可以自己完成行銷、銷售、客服等工作</small>

Sociable App 能串起所有的服務甚至其他 app，同時讓整體的形象與客戶體驗更加一致，而這讓企業自動達成了[全通路體驗](https://en.wikipedia.org/wiki/Omnichannel)的理想。

## 現在就是最好的時候

跟 chatbot 熱潮的時候相比，今天社群媒體甚至更流行了，相關科技如語意辨識也更加成熟。[Whatsapp 最近也終於開放了 API](https://developers.facebook.com/blog/post/2022/05/19/whatsapp-cloud-based-api/)，這讓平台的支援更加完整。現在正是改變發生的時候！

Machinat.js 能讓你輕鬆快速的打造社群平台上的各種應用。你可以用一行指令創建一個跨平台的 app，幾分鐘就能運行起來並開始開發，並且一天內讓他上線運作。在這個社群時代裡，這是最簡單發布一個 app 給使用者的方式。

<img height={500} src={require("../static/img/start-dev.webp").default} />

> <small>開始一個 sociable app 是如此容易，這段影片是用實際速度播放</small>

目前我們支援 4 個社群平台：[Twitter](https://twitter.com/)、[Messenger](https://www.messenger.com/)、[Telegram](https://telegram.org/)、[LINE](https://line.me/)。
未來我們會陸續支援更多平台，並預計今年內會涵蓋所有主流的社群平台。

你可以從我們的[教學](https://machinat.com/docs/learn/)開始第一個 Sociable App。

## 加入我們

Machinat 的目標是讓開發者能發布各種軟體到所有的社群平台上。  
讓軟體能真的在我們日常生活裡，隨時隨地提供各種功能；  
能自動化社群媒體上的各種工作，並為社群服務帶來新的可能性；  
能用我們最熟悉的方式提供服務，像一個貼身秘書甚至是最好的朋友。

但要達成這樣的技術變革，不是一個框架就能完成，這需要一整個技術生態系。
Machinat.js 設計成讓所有人都能加入各種第三方平台、插件、以及 UI。
有更多人加入這個生態圈，越有可能實現這個社群時代裡的典範轉移。

如果你是開發者，可以在 [GitHub](https://github.com/machinat/machinat) 上找到各種資源，並歡迎加入我們的 [Discord](https://discord.com/channels/976145555812139058/976145555812139061) 討論各種想法。
如果你有個很酷的點子，或是有任何合作的機會，請 mail 給我一起討論看看如何將他實現：[`patrick.liu@machinat.com`](mailto:patrick.liu@machinat.com)

最後，我可能需要你的幫助才有辦法繼續完成接下來的工作。過去三年我寫了17萬行以上的程式碼，讓框架能作到現在的體驗。你的一點抖內可以幫助我繼續推進這個願景，並且我會提供一些技術支援之類的回饋。


import BuyMeACoffee from '../blog/assets/buymeacoffee.svg';

<a href="https://www.buymeacoffee.com/machinatjs">
  <BuyMeACoffee />
</a>


祝各位開心的開發新一代 app！
