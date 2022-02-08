import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import axios from "axios";
import vuetify from "./plugins/vuetify";
import VueCurrencyInput from 'vue-currency-input'

import Notifications from "./components/Notifications";
import QuestionRenderer from "./components/QuestionRenderer";

Vue.config.productionTip = false;

axios.defaults.withCredentials = true;

Vue.component("notifications", Notifications);
Vue.component("question-renderer", QuestionRenderer);

Vue.use(VueCurrencyInput, { globalOptions: { currency: 'USD', locale: 'en' } });

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount("#app");
