"use strict";(self.webpackChunk=self.webpackChunk||[]).push([[4925],{3905:function(e,t,n){n.d(t,{Zo:function(){return d},kt:function(){return h}});var r=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function l(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var s=r.createContext({}),c=function(e){var t=r.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):l(l({},t),e)),n},d=function(e){var t=c(e.components);return r.createElement(s.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},p=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,o=e.originalType,s=e.parentName,d=i(e,["components","mdxType","originalType","parentName"]),p=c(n),h=a,m=p["".concat(s,".").concat(h)]||p[h]||u[h]||o;return n?r.createElement(m,l(l({ref:t},d),{},{components:n})):r.createElement(m,l({ref:t},d))}));function h(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=n.length,l=new Array(o);l[0]=p;var i={};for(var s in t)hasOwnProperty.call(t,s)&&(i[s]=t[s]);i.originalType=e,i.mdxType="string"==typeof e?e:a,l[1]=i;for(var c=2;c<o;c++)l[c]=n[c];return r.createElement.apply(null,l)}return r.createElement.apply(null,n)}p.displayName="MDXCreateElement"},5162:function(e,t,n){n.d(t,{Z:function(){return l}});var r=n(7294),a=n(6010),o="tabItem_Ymn6";function l(e){var t=e.children,n=e.hidden,l=e.className;return r.createElement("div",{role:"tabpanel",className:(0,a.Z)(o,l),hidden:n},t)}},5488:function(e,t,n){n.d(t,{Z:function(){return h}});var r=n(7462),a=n(7294),o=n(6010),l=n(2389),i=n(7392),s=n(7094),c=n(2466),d="tabList__CuJ",u="tabItem_LNqP";function p(e){var t,n,l=e.lazy,p=e.block,h=e.defaultValue,m=e.values,f=e.groupId,v=e.className,g=a.Children.map(e.children,(function(e){if((0,a.isValidElement)(e)&&"value"in e.props)return e;throw new Error("Docusaurus error: Bad <Tabs> child <"+("string"==typeof e.type?e.type:e.type.name)+'>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.')})),k=null!=m?m:g.map((function(e){var t=e.props;return{value:t.value,label:t.label,attributes:t.attributes}})),C=(0,i.l)(k,(function(e,t){return e.value===t.value}));if(C.length>0)throw new Error('Docusaurus error: Duplicate values "'+C.map((function(e){return e.value})).join(", ")+'" found in <Tabs>. Every value needs to be unique.');var b=null===h?h:null!=(t=null!=h?h:null==(n=g.find((function(e){return e.props.default})))?void 0:n.props.value)?t:g[0].props.value;if(null!==b&&!k.some((function(e){return e.value===b})))throw new Error('Docusaurus error: The <Tabs> has a defaultValue "'+b+'" but none of its children has the corresponding value. Available values are: '+k.map((function(e){return e.value})).join(", ")+". If you intend to show no default tab, use defaultValue={null} instead.");var y=(0,s.U)(),T=y.tabGroupChoices,N=y.setTabGroupChoices,w=(0,a.useState)(b),S=w[0],x=w[1],P=[],U=(0,c.o5)().blockElementScrollPositionUntilNextRender;if(null!=f){var I=T[f];null!=I&&I!==S&&k.some((function(e){return e.value===I}))&&x(I)}var j=function(e){var t=e.currentTarget,n=P.indexOf(t),r=k[n].value;r!==S&&(U(t),x(r),null!=f&&N(f,String(r)))},O=function(e){var t,n=null;switch(e.key){case"ArrowRight":var r,a=P.indexOf(e.currentTarget)+1;n=null!=(r=P[a])?r:P[0];break;case"ArrowLeft":var o,l=P.indexOf(e.currentTarget)-1;n=null!=(o=P[l])?o:P[P.length-1]}null==(t=n)||t.focus()};return a.createElement("div",{className:(0,o.Z)("tabs-container",d)},a.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,o.Z)("tabs",{"tabs--block":p},v)},k.map((function(e){var t=e.value,n=e.label,l=e.attributes;return a.createElement("li",(0,r.Z)({role:"tab",tabIndex:S===t?0:-1,"aria-selected":S===t,key:t,ref:function(e){return P.push(e)},onKeyDown:O,onFocus:j,onClick:j},l,{className:(0,o.Z)("tabs__item",u,null==l?void 0:l.className,{"tabs__item--active":S===t})}),null!=n?n:t)}))),l?(0,a.cloneElement)(g.filter((function(e){return e.props.value===S}))[0],{className:"margin-top--md"}):a.createElement("div",{className:"margin-top--md"},g.map((function(e,t){return(0,a.cloneElement)(e,{key:t,hidden:e.props.value!==S})}))))}function h(e){var t=(0,l.Z)();return a.createElement(p,(0,r.Z)({key:String(t)},e))}},6975:function(e,t,n){n.r(t),n.d(t,{GetUserProfile:function(){return m},UseTodoController:function(){return v},assets:function(){return h},contentTitle:function(){return u},default:function(){return k},frontMatter:function(){return d},metadata:function(){return p},toc:function(){return f}});var r=n(7462),a=n(3366),o=(n(7294),n(3905)),l=n(3066),i=n(5488),s=n(5162),c=["components"],d={title:"Service and State"},u=void 0,p={unversionedId:"learn/service-and-state",id:"learn/service-and-state",title:"Service and State",description:"Despite sending messages, a bot requires many other services to provide functional features.",source:"@site/docs/learn/service-and-state.mdx",sourceDirName:"learn",slug:"/learn/service-and-state",permalink:"/docs/learn/service-and-state",draft:!1,editUrl:"https://github.com/machinat/sociably/edit/master/website/docs/learn/service-and-state.mdx",tags:[],version:"current",frontMatter:{title:"Service and State"},sidebar:"docs",previous:{title:"UI Component",permalink:"/docs/learn/component"},next:{title:"Recognize Intent",permalink:"/docs/learn/recognize-intent"}},h={},m=function(e){var t=e.platform;return(0,o.kt)("div",null,(0,o.kt)(l.Z,{language:"tsx",title:"src/handlers/handleChat.tsx",mdxType:"CodeBlock"},"//...\nconst handleChat = makeContainer({\n  deps: [useIntent, useUserProfile],\n})(\n  (getIntent, getUserProfile) =>\n    async (\n      ctx: ChatEventContext & { event: { category: 'message'| 'postback' } }\n    ) => {\n      const { event, reply } = ctx;\n      const intent = await getIntent(event);"+("telegram"===t?"\n      // highlight-start\n      if (!event.channel) {\n        return;\n      }\n      // highlight-end":"")+"\n      //...\n\n      // highlight-next-line\n      const profile = await getUserProfile(event.user);\n      return reply(\n        <WithMenu todoCount={3}>\n          {/* highlight-next-line */}\n          <p>Hello{profile ? `, ${profile.name}` : ''}! I'm a Todo Bot \ud83e\udd16</p>\n        </WithMenu>\n      );\n    }\n);\n//..."))},f=[{value:"Use Services",id:"use-services",level:2},{value:"Service Container",id:"service-container",level:3},{value:"Service Provider",id:"service-provider",level:3},{value:"Get User Profile",id:"get-user-profile",level:3},{value:"Access State",id:"access-state",level:3},{value:"State Storage",id:"state-storage",level:3},{value:"Providing Services",id:"providing-services",level:2},{value:"Create a Service",id:"create-a-service",level:3},{value:"Channel State",id:"channel-state",level:3},{value:"Register Services",id:"register-services",level:3},{value:"Use <code>TodoController</code>",id:"use-todocontroller",level:3}],v=function(e){var t=e.platform;return(0,o.kt)("div",null,(0,o.kt)(l.Z,{language:"tsx",title:"src/handlers/handleChat.tsx",mdxType:"CodeBlock"},"\n// highlight-next-line\nimport TodoController from '../services/TodoController';\n// ...\nconst handleChat = makeContainer({\n  // highlight-next-line\n  deps: [useIntent, useUserProfile, TodoController],\n})(\n  // highlight-next-line\n  (getIntent, getUserProfile, todoController) =>\n  async (\n    ctx: ChatEventContext & { event: { category: 'message' | 'postback' } }\n  ) => {\n      const { event, reply } = ctx;\n      const intent = await getIntent(event);"+("telegram"===t?"\n      if (!event.channel) {\n        return;\n      }":"")+"\n\n      if (intent.type === 'list') {\n        // highlight-start\n        const { data } = await todoController.getTodos(event.channel);\n        return reply(<TodoList todos={data.todos} />);\n        // highlight-end\n      }\n      // highlight-start\n      if (intent.type === 'finish') {\n        const { todo, data } = await todoController.finishTodo(\n          event.channel,\n          intent.payload.id\n        );\n        return reply(\n          <WithMenu todoCount={data.todos.length}>\n            {todo ? (\n              <p>Todo \"<b>{todo.name}</b>\" is done!</p>\n            ) : (\n              <p>This todo is closed.</p>\n            )}\n          </WithMenu>\n        );\n      }\n      // highlight-end\n\n      if (event.type === 'text') {\n        const matchingAddTodo = event.text.match(/add(s+todo)?(.*)/i);\n        if (matchingAddTodo) {\n          const todoName = matchingAddTodo[2].trim();\n\n          // highlight-next-line\n          const { data } = await todoController.addTodo(event.channel, todoName);\n          return reply(\n            // highlight-next-line\n            <WithMenu todoCount={data.todos.length}>\n              <p>Todo \"<b>{todoName}</b>\" is added!</p>\n            </WithMenu>\n          );\n        }\n      }\n\n      const profile = await profiler.getUserProfile(event.user);\n      // highlight-next-line\n      const { data } = await todoController.getTodos(event.channel);\n      return reply(\n        // highlight-next-line\n        <WithMenu todoCount={data.todos.length}>\n          <p>Hello{profile ? `, ${profile.name}` : ''}! I'm a Todo Bot \ud83e\udd16</p>\n        </WithMenu>\n      );\n    }\n);\n//..."))},g={GetUserProfile:m,toc:f,UseTodoController:v};function k(e){var t=e.components,l=(0,a.Z)(e,c);return(0,o.kt)("wrapper",(0,r.Z)({},g,l,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("blockquote",null,(0,o.kt)("p",{parentName:"blockquote"},"Despite sending messages, a bot requires many other services to provide functional features.\nIn this lesson, you\u2019ll learn how to use the DI (dependencies injection) system\nto access chat state and other services."),(0,o.kt)("p",{parentName:"blockquote"},(0,o.kt)("em",{parentName:"p"},"Time to accomplish: 15 minutes"))),(0,o.kt)("h2",{id:"use-services"},"Use Services"),(0,o.kt)("p",null,"Calling users by their name is a common feature to improve chat experience.\nLet's implement it by editing ",(0,o.kt)("inlineCode",{parentName:"p"},"handleChat")," like this:"),(0,o.kt)(i.Z,{groupId:"chat-platforms",defaultValue:"messenger",values:[{label:"Messenger",value:"messenger"},{label:"Telegram",value:"telegram"},{label:"LINE",value:"line"}],mdxType:"Tabs"},(0,o.kt)(s.Z,{value:"messenger",mdxType:"TabItem"},(0,o.kt)(m,{platform:"messenger",mdxType:"GetUserProfile"})),(0,o.kt)(s.Z,{value:"telegram",mdxType:"TabItem"},(0,o.kt)(m,{platform:"telegram",mdxType:"GetUserProfile"})),(0,o.kt)(s.Z,{value:"line",mdxType:"TabItem"},(0,o.kt)(m,{platform:"line",mdxType:"GetUserProfile"}))),(0,o.kt)("p",null,"Now the bot can say hello with the user's name:"),(0,o.kt)("img",{width:400,src:n(5300).Z}),(0,o.kt)("h3",{id:"service-container"},"Service Container"),(0,o.kt)("p",null,"The ",(0,o.kt)("inlineCode",{parentName:"p"},"handleChat")," handler is a ",(0,o.kt)("strong",{parentName:"p"},"service container"),".\nA container declares the services it requires,\nand the system will inject the required dependencies at runtime."),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"handleChat")," is declared by ",(0,o.kt)("inlineCode",{parentName:"p"},"makeContainer({ deps: [useIntent, useUserProfile] })(factoryFn)"),".\nIt requires the ",(0,o.kt)("inlineCode",{parentName:"p"},"useIntent")," and ",(0,o.kt)("inlineCode",{parentName:"p"},"useUserProfile")," services, which can be used like:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"(getIntent, getUserProfile) =>    // factory fn, receivces service instances\n  async (context) => {/* ... */}  // handler fn, receivces event context\n")),(0,o.kt)("p",null,"The container function takes the required services and returns the handler function.\nThen the services can be used in the handler like:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"  const profile = await getUserProfile(event.user);\n")),(0,o.kt)("h3",{id:"service-provider"},"Service Provider"),(0,o.kt)("p",null,"Let's go deeper to see what happens in the ",(0,o.kt)("inlineCode",{parentName:"p"},"useUserProfile")," service.\nCheck the ",(0,o.kt)("inlineCode",{parentName:"p"},"src/services/useUserProfile.ts")," file, you should codes like:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts",metastring:'{2-4,10,16-18} title="src/services/useUserProfile.ts"',"{2-4,10,16-18}":!0,title:'"src/services/useUserProfile.ts"'},"import {\n  makeFactoryProvider,\n  BasicProfiler,\n  StateController,\n  SociablyUser,\n  SociablyProfile,\n} from '@sociably/core';\n// ...\nconst useUserProfile =\n  (profiler: BasicProfiler, stateController: StateController) =>\n  async (user: SociablyUser) => {\n    // ...\n    return profile;\n  };\n\nexport default makeFactoryProvider({\n  deps: [BasicProfiler, StateController],\n})(useUserProfile);\n")),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"useUserProfile")," is a service provider that requires its ",(0,o.kt)("inlineCode",{parentName:"p"},"deps")," just like a container.\nThe difference is a provider can be required as ",(0,o.kt)("inlineCode",{parentName:"p"},"deps")," so we can use it in the handler."),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"useUserProfile")," uses two built-in services: ",(0,o.kt)("inlineCode",{parentName:"p"},"BasicProfiler")," and ",(0,o.kt)("inlineCode",{parentName:"p"},"StateController"),"."),(0,o.kt)("h3",{id:"get-user-profile"},"Get User Profile"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"BasicProfiler")," fetches a user\u2019s profile from the chat platform.\nLike:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="src/services/useUserProfile.ts"',title:'"src/services/useUserProfile.ts"'},"  const profile = await profiler.getUserProfile(user);\n")),(0,o.kt)("h3",{id:"access-state"},"Access State"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"StateController")," can access the user/chat/global state data from the storage.\nLike:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="src/services/useUserProfile.ts"',title:'"src/services/useUserProfile.ts"'},"  // highlight-start\n  const userState = stateController.userState(user);\n  const cached = await userState.get<ProfileCache>('profile_cache');\n  // highlight-end\n  if (cached) {\n    return cached.profile;\n  }\n\n  const profile = await profiler.getUserProfile(user);\n  if (profile) {\n    // highlight-next-line\n    await userState.set<ProfileCache>('profile_cache', { profile });\n  }\n")),(0,o.kt)("p",null,"Here we use ",(0,o.kt)("inlineCode",{parentName:"p"},"controller.userState(user).get(key)")," to get the cached profile of the user.\nIf there isn't, we fetch the profile and cache it with ",(0,o.kt)("inlineCode",{parentName:"p"},"controller.userState(user).set(key, value)"),"."),(0,o.kt)("h3",{id:"state-storage"},"State Storage"),(0,o.kt)("p",null,"The state data is stored at ",(0,o.kt)("inlineCode",{parentName:"p"},".state_data.json")," file while in development.\nCheck it and you should see the saved profile like:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-json",metastring:'{5-14} title=".state_data.json"',"{5-14}":!0,title:'".state_data.json"'},'{\n  "channelStates": {},\n  "userStates": {\n    "messenger.12345.67890": {\n      "profile_cache": {\n        "$type": "MessengerUserProfile",\n        "$value": {\n          "id": "67890",\n          "name": "John Doe",\n          "first_name": "John",\n          "last_name": "Doe",\n          "profile_pic": "https://..."\n        }\n      }\n    }\n  },\n  "globalStates": {}\n}\n')),(0,o.kt)("h2",{id:"providing-services"},"Providing Services"),(0,o.kt)("p",null,"Despite the built-in services, you might want to make your own ones to reuse logic.\nLet's create a new service to handle the CRUD of todos."),(0,o.kt)("h3",{id:"create-a-service"},"Create a Service"),(0,o.kt)("p",null,"First add the type of todos state:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="src/types.ts"',title:'"src/types.ts"'},"//...\nexport type TodoState = {\n  currentId: number;\n  todos: Todo[];\n  finishedTodos: Todo[];\n};\n")),(0,o.kt)("p",null,"To not repeat similar steps,\nplease download the ",(0,o.kt)("inlineCode",{parentName:"p"},"TodoController.ts")," file with this command:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"curl -o ./src/services/TodoController.ts https://raw.githubusercontent.com/machinat/sociably-todo-example/main/src/services/TodoController.ts\n")),(0,o.kt)("p",null,"In the file we create a ",(0,o.kt)("inlineCode",{parentName:"p"},"TodoController")," service to manage todos.\nCheck ",(0,o.kt)("inlineCode",{parentName:"p"},"src/services/TodoController.ts"),", it's declared like this:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="src/services/TodoController.ts"',title:'"src/services/TodoController.ts"'},"//...\nexport class TodoController {\n  stateController: StateController;\n\n  constructor(stateController: StateController) {\n    this.stateController = stateController;\n  }\n  //...\n}\n\nexport default makeClassProvider({\n  deps: [StateController],\n})(TodoController);\n")),(0,o.kt)("p",null,"The ",(0,o.kt)("inlineCode",{parentName:"p"},"makeClassProvider")," works just like ",(0,o.kt)("inlineCode",{parentName:"p"},"makeFactoryProvider"),",\nexcept that the provider is a class.\nIt also requires ",(0,o.kt)("inlineCode",{parentName:"p"},"StateController")," to save/load todos data."),(0,o.kt)("h3",{id:"channel-state"},"Channel State"),(0,o.kt)("p",null,"In the ",(0,o.kt)("inlineCode",{parentName:"p"},"TodoController")," we store the todos data with ",(0,o.kt)("inlineCode",{parentName:"p"},"channelState"),".\nIt works the same as ",(0,o.kt)("inlineCode",{parentName:"p"},"userState"),", but it saves the data of a chat instead."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts",metastring:'{6} title="src/services/TodoController.ts"',"{6}":!0,title:'"src/services/TodoController.ts"'},"//...\nasync getTodos(\n  channel: SociablyChannel\n): Promise<{ todo: null; data: TodoState }> {\n  const data = await this.stateController\n    .channelState(channel)\n    .get<TodoState>('todo_data');\n\n  return {\n    todo: null,\n    data: data || { currentId: 0, todos: [], finishedTodos: [] },\n  };\n}\n//...\n")),(0,o.kt)("h3",{id:"register-services"},"Register Services"),(0,o.kt)("p",null,"A new service must be registered in the app before using it.\nRegister the ",(0,o.kt)("inlineCode",{parentName:"p"},"TodoController")," in ",(0,o.kt)("inlineCode",{parentName:"p"},"src/app.ts")," like:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts",metastring:'{1,7-8} title="src/app.ts"',"{1,7-8}":!0,title:'"src/app.ts"'},"import TodoController from './services/TodoController';\n//...\nconst createApp = (options?: CreateAppOptions) => {\n  return Sociably.createApp({\n    modules: [/* ... */],\n    platforms: [/* ... */],\n    services: [\n      TodoController,\n      // ...\n    ],\n  });\n};\n")),(0,o.kt)("h3",{id:"use-todocontroller"},"Use ",(0,o.kt)("inlineCode",{parentName:"h3"},"TodoController")),(0,o.kt)("p",null,"Now ",(0,o.kt)("inlineCode",{parentName:"p"},"TodoController")," can be used like other services.\nWe can use it to easily complete the CRUD features.\nEdit ",(0,o.kt)("inlineCode",{parentName:"p"},"handleChat")," like this:"),(0,o.kt)(i.Z,{groupId:"chat-platforms",defaultValue:"messenger",values:[{label:"Messenger",value:"messenger"},{label:"Telegram",value:"telegram"},{label:"LINE",value:"line"}],mdxType:"Tabs"},(0,o.kt)(s.Z,{value:"messenger",mdxType:"TabItem"},(0,o.kt)(v,{platform:"messenger",mdxType:"UseTodoController"})),(0,o.kt)(s.Z,{value:"telegram",mdxType:"TabItem"},(0,o.kt)(v,{platform:"telegram",mdxType:"UseTodoController"})),(0,o.kt)(s.Z,{value:"line",mdxType:"TabItem"},(0,o.kt)(v,{platform:"line",mdxType:"UseTodoController"}))),(0,o.kt)("p",null,"Now try adding a todo with ",(0,o.kt)("inlineCode",{parentName:"p"},"add todo <name>")," command, and check the ",(0,o.kt)("inlineCode",{parentName:"p"},".state_data.json"),"\nfile. You should see the stored todo data like:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-json",metastring:'{5-13} title=".state_data.json"',"{5-13}":!0,title:'".state_data.json"'},'{\n  "userStates": {...},\n  "channelStates": {\n    "messenger.12345.psid.67890": {\n      "todo_data": {\n        "currentId": 1,\n        "todos": [\n          {\n            "id": 1,\n            "name": "Master State Service"\n          }\n        ],\n        "finishedTodos": []\n      }\n    }\n  },\n  "globalStates": {}\n}\n')),(0,o.kt)("p",null,"Then press ",(0,o.kt)("inlineCode",{parentName:"p"},"Done \u2713")," button in the todos list, the bot should reply like:"),(0,o.kt)("img",{width:400,src:n(7747).Z}),(0,o.kt)("p",null,"Check ",(0,o.kt)("inlineCode",{parentName:"p"},".state_data.json"),", the todo should be moved to the\n",(0,o.kt)("inlineCode",{parentName:"p"},'"finishedTodos"')," section:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-json",metastring:'title=".state_data.json"',title:'".state_data.json"'},'    "finishedTodos": [\n      {\n        "id": 1,\n        "name": "Master State Service"\n      }\n    ]\n')),(0,o.kt)("hr",null),(0,o.kt)("p",null,"Now our bot can provide features with real data in the state.\nNext, we'll make the bot understand what we say."))}k.isMDXComponent=!0},7747:function(e,t,n){t.Z=n.p+"assets/images/finish-todo-1a4bdda0216c2094c2c6623060ce0dc5.png"},5300:function(e,t,n){t.Z=n.p+"assets/images/hello-with-name-df7254168112c2c7e0d0cc2c1539eb52.png"}}]);