import { createRouter, createWebHistory, RouteLocation, RouteRecordRaw } from "vue-router";

import adminRoutes from "@/modules/administration/router";
import { authGuard, useAuth0 } from "@auth0/auth0-vue";

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
        path: "/survey-agent/:token",
        component: () => import("@/views/AuthenticatedSurvey.vue"),
        beforeEnter: requireLogin,
      },
      {
        path: "/survey-manual/:token",
        component: () => import("@/views/AuthenticatedManualSurvey.vue"),
        beforeEnter: requireLogin,
      },
      {
        path: "/manual-entry/:token",
        component: () => import("@/views/AuthenticatedFullManualSurvey.vue"),
        beforeEnter: requireLogin,
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

import { AuthHelper } from "@/plugins/auth";

async function requireLogin(to: RouteLocation): Promise<boolean | string> {
  let auth = AuthHelper;
  let hasAuth = await authGuard(to);

  if (hasAuth) {
    return true;
  }

  return "/survey/not-found";
}

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
