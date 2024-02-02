import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

import adminRoutes from "@/modules/administration/router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    component: () => import("@/layouts/DefaultNoAuth.vue"),
    children: [
      {
        path: "",
        component: () => import("@/views/Home.vue"),
      },
      {
        path: "/survey/complete",
        component: () => import("@/views/Complete.vue"),
      },
      {
        path: "/survey/not-found",
        component: () => import("@/views/SurveyNotFound.vue"),
      },
      {
        path: "/survey/:token",
        component: () => import("@/views/Survey.vue"),
      },
      {
        path: "/preview/:token",
        component: () => import("@/views/Preview.vue"),
      },
    ],
  },
  {
    path: "/sign-in",
    component: () => import("@/layouts/Blank.vue"),
    children: [
      {
        path: "",
        component: () => import("@/modules/authentication/views/SignIn.vue"),
      },
    ],
  },

  ...adminRoutes,

  {
    path: "/:pathMatch(.*)*",
    name: "Not Found",
    component: () => import("@/views/NotFound.vue"),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
