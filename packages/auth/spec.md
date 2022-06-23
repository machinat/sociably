## Authorization Flow

 To embed a webview in cross-platform chatrooms, the web app have to implement all the auth flows of different platforms. The protocol might differ widely depends on the platform and the user agent (in-app or in-browser). For example webview opened in the Messenger app retrieve the auth context purely on client side. But the participate of server-side is required for an _authorization code grant_ while opened in browser (and many other platforms).

 `@sociably/auth` defines a flexible flow that can fit the requirements of different the protocols on both client and server side. And finally the web app is authorized with a [two-cookie approach](https://medium.com/lightrail/getting-token-authentication-right-in-a-stateless-single-page-application-57d0c6474e3) handled by the package itself.

There are some typical example flows below.

 ### Authorization Code Grant

```
 +-------+   +---------+ +-----+      +--------+     +--------+        +-----+
 | User  |   | Browser | | App |      | Client |     | Server |        | IdP |
 +-------+   +---------+ +-----+      +--------+     +--------+        +-----+
   |             |         |              |               |                 |
   | linked      |         |              |               |                 |
   | from IM     |         |              |               |                 |
   |------------>|         |              |               |                 |
   |             |         |              |               |                 |
   |             | run     |              |               |                 |
   |             |-------->|              |               |                 |
   |             |         |              |               |                 |
   |             |         | #init()      |               |                 |
   |             |         |------------->|               |                 |
   |             |         |              |               |                 |
   |             |         |              | redirect      |                 |
   |             |         |              |-------------->|                 |
   |             |         |              |               |                 |
   |             |         |              |    save state |                 |
   |             |<---------------------------------------|                 |
   |             |         |              |               |                 |
   |             |         |              |               | redirect        |
   |             |         |              |               |---------------->|
   |             |         |              |               |                 |
   |             |         |              |               |  ask permission |
   |<-----------------------------------------------------------------------|
   |             |         |              |               |                 |
   | allow auth  |         |              |               |                 |
   |----------------------------------------------------------------------->|
   |             |         |              |               |                 |
   |             |         |              |               |        redirect |
   |             |         |              |               |         w/ code |
   |             |         |              |               |<----------------|
   |             |         |              |               |                 |
   |             |         |              |               | exchange        |
   |             |         |              |               | token           |
   |             |         |              |               |---------------->|
   |             |         |              |               |                 |
   |             |         |              |               |    token & data |
   |             |         |              |               |<----------------|
   |             |         |              |               |                 |
   |             |         |              |     sign auth |                 |
   |             |         |              |       cookies |                 |
   |             |<---------------------------------------|                 |
   |             |         |              |               |                 |
   |             |         |              |      redirect |                 |
   |             |         |<-----------------------------|                 |
   |             |         |              |               |                 |
   |             |         | #init()      |               |                 |
   |             |         |------------->|               |                 |
   |             |         |              |               |                 |
   |             |         | app start    |               |                 |
   |             |         |------        |               |                 |
   |             |         |     |        |               |                 |
   |             |         |<-----        |               |                 |
   |             |         |              |               |                 |
   |             |         | #auth()      |               |                 |
   |             |         |------------->|               |                 |
   |             |         |              |               |                 |
   |             |         |         auth |               |                 |
   |             |         |      context |               |                 |
   |             |         |<-------------|               |                 |
   |             |         |              |               |                 |
   |             |         | call API w/ auth cookies     |                 |
   |             |         |----------------------------->|                 |
   |             |         |              |               |                 |
   |             |         |              authorized data |                 |
   |             |         |<-----------------------------|                 |
   |             |         |              |               |                 |
   |           interact as |              |               |                 |
   |           authed user |              |               |                 |
   |<----------------------|              |               |                 |
   |             |         |              |               |                 |
```
