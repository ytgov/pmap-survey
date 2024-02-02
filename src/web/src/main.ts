import { createApp, defineComponent } from "vue";
import { createPinia } from "pinia";
import { router } from "./routes";
import { AuthHelper } from "@/plugins/auth";

// Plugins
import { registerPlugins } from "./plugins";
import { Auth0Plugin } from "@auth0/auth0-vue";
import { Router } from "vue-router";

const pinia = createPinia();

import App from "./App.vue";
const app = createApp(App);
app
  .use(pinia)
  .use(router)
  .use(AuthHelper as any);

app.config.globalProperties.$auth = AuthHelper;

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $auth: Auth0Plugin;
    $router: Router;
  }
}

import Notifications from "./components/Notifications";
import QuestionRenderer from "./components/QuestionRenderer";

app.component("notifications", Notifications);
app.component("question-renderer", QuestionRenderer);

export {}; // Important! See note.

registerPlugins(app);

app.mount("#app");
