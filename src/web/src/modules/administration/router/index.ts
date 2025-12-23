import { authGuard } from "@auth0/auth0-vue";
import { RouteLocation } from "vue-router";
import { User, useUserStore } from "@/store/UserStore";

const routes = [
  {
    path: "/administration",
    component: () => import("@/layouts/Default.vue"),
    children: [
      {
        path: "",
        component: () => import("../views/Dashboard.vue"),
        beforeEnter: requireAccess,
        meta: {
          allow_admin: true,
        },
      },
      {
        path: "users",
        component: () => import("../modules/users/views/UserList.vue"),
        beforeEnter: requireAccess,
        meta: {
          require_admin: true,
        },
      },
      {
        path: "surveys",
        component: () => import("../modules/survey/views/SurveyList.vue"),
        beforeEnter: requireAccess,
        meta: {
          allow_admin: true,
        },
      },
      {
        path: "surveys/:SID",
        component: () => import("../modules/survey/views/SurveyEditor.vue"),
        beforeEnter: requireAccess,
        meta: {
          allow_admin: true,
        },
      },
      {
        path: "emailer",
        component: () => import("../modules/emailer/views/EmailerHome.vue"),
        beforeEnter: requireAccess,
        meta: {
          allow_admin: true,
        },
      },
      {
        path: "participants",
        component: () => import("../modules/participants/views/ParticipantList.vue"),
        beforeEnter: requireAccess,
        meta: {
          allow_admin: true,
        },
      },
      {
        path: "results",
        component: () => import("../modules/results/views/ResultsList.vue"),
        beforeEnter: requireAccess,
        meta: {
          allow_admin: true,
        },
      },
      {
        path: "results/:SID",
        component: () => import("../modules/results/views/ResultsDetail.vue"),
        beforeEnter: requireAccess,
        meta: {
          allow_admin: true,
        },
      },
      {
        path: "demographic-groups",
        component: () => import("../modules/demographic-group/views/GroupList.vue"),
        beforeEnter: requireAccess,
        meta: {
          allow_admin: true,
        },
      },
      {
        path: "survey-links",
        component: () => import("../modules/survey-links/views/LinkList.vue"),
        beforeEnter: requireAccess,
        meta: {
          allow_admin: true,
        },
      },
      {
        path: "ai-assistant",
        component: () => import("../modules/ai-assistant/views/AIAssistant.vue"),
        beforeEnter: requireAccess,
        meta: {
          allow_admin: true,
        },
      },
    ],
  },
];

async function requireAccess(to: RouteLocation): Promise<boolean | string> {
  let hasAuth = await authGuard(to);
  if (!hasAuth) return false;

  let user = await waitForUserToLoad();

  if (!user || !user.sub) return "/NotAuthorized?Requires-User";

  if (user.STATUS != "Active") return "/NotAuthorized?Requires-Active";

  if (to.meta && to.meta.allow_admin && user.IS_ADMIN == "Y") return true;

  if (to.meta && to.meta.require_admin) {
    if (user.IS_ADMIN != "Y") return "/NotAuthorized?Requires-Admin";
    return true;
  }

  if (to.meta && to.meta.role) {
    if (user.ROLE == to.meta.role) return true;

    return "/NotAuthorized?Requires-" + to.meta.role;
  }

  return true;
}

export async function waitForUserToLoad(): Promise<User | null> {
  let u = useUserStore();
  await u.initialize();
  return u.user;
}

export default routes;
