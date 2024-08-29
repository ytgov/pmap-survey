import { defineStore } from "pinia";

import { useApiStore } from "@/store/ApiStore";
import { PROFILE_URL } from "@/urls";

export const useUserStore = defineStore("user", {
  state: () => ({
    isLoading: true,
    user: null as User | null,
  }),
  getters: {
    isAdmin(state) {
      return true;
    },
  },
  actions: {
    async initialize() {
      if (!this.user || !this.user.sub) {
        await this.loadCurrentUser();
        console.log("Initialized user store");
      }
    },

    async loadCurrentUser() {
      this.isLoading = true;
      let api = useApiStore();
      await api
        .secureCall("get", PROFILE_URL)
        .then((resp) => {
          this.user = resp.data;
        })
        .catch(() => {
          this.user = null;
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
  },
});

export type User = {
  display_name: string;
  first_name: string;
  last_name: string;
  email: string;
  EMAIL: string;
  ynet_id: string;
  sub: string;
  STATUS: string;
  ROLE: string;
  IS_ADMIN: string;
};
