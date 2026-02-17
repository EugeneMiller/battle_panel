import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import EncounterView from "../views/EncounterView.vue";
import AboutView from "../views/AboutView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: HomeView },
    { path: "/encounter/:id", name: "encounter", component: EncounterView, props: true },
    { path: "/about", name: "about", component: AboutView }
  ]
});
