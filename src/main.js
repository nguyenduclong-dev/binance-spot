import Vue from "vue";
import App from "./App.vue";
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";

const el = document.createElement("div");
document.body.appendChild(el);

Vue.use(ElementUI, { size: "small" });

Vue.config.productionTip = false;
Vue.config.devtools = true;

new Vue({
  render: (h) => h(App),
}).$mount(el);
