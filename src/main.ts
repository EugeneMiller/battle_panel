import { createApp } from "vue";
import { createPinia } from "pinia";
import { registerSW } from "virtual:pwa-register";
import App from "./App.vue";
import { router } from "./router";
import "./style.css";
import { useEncounterStore } from "./stores/encounterStore";

registerSW({ immediate: true });

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const store = useEncounterStore();
store.init();

app.mount("#app");
