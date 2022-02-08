import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import NotFound from "../views/NotFound.vue";
import Preview from "../views/Preview.vue";
import Survey from "../views/Survey.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home
  },
  {
    path: "/survey/:token",
    name: "Survey",
    component: Survey
  },

  {
    path: "/preview/:token",
    name: "Preview",
    component: Preview
  },


  {
    path: "*",
    name: "Not Found",
    component: NotFound
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});


router.beforeEach(async (to, from, next) => {
  
  return next();
});

export default router;
