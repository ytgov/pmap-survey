import { defineStore } from "pinia";

import { useNotificationStore } from "@/store/NotificationStore";
import { useApiStore } from "@/store/ApiStore";
import { GROUPS_URL } from "@/urls";
import { Survey } from "../../emailer/store";

let m = useNotificationStore();

interface AdminState {
  groups: Array<DemographicGroup>;
  selectedGroup: DemographicGroup | undefined;
  isLoading: boolean;
}

export const useDemographicAdminStore = defineStore("demographicAdmin", {
  state: (): AdminState => ({
    groups: [],
    isLoading: false,
    selectedGroup: undefined,
  }),
  getters: {
    groupCount(state) {
      if (state && state.groups) return state.groups.length;
      return 0;
    },
  },
  actions: {
    async getAllGroups() {
      this.isLoading = true;
      let api = useApiStore();
      await api
        .secureCall("get", GROUPS_URL)
        .then((resp) => {
          this.groups = resp.data;
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    async getDemographics() {
      this.isLoading = true;
      let api = useApiStore();
      return await api
        .secureCall("get", `${GROUPS_URL}/demographics`)
        .then((resp) => {
          return resp.data;
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    selectGroup(user: any) {
      this.selectedGroup = user;
    },
    unselectGroup() {
      this.selectedGroup = undefined;
    },
    async saveGroup() {
      this.isLoading = true;
      let api = useApiStore();

      if (this.selectedGroup) {
        await api
          .secureCall("put", `${GROUPS_URL}/${this.selectedGroup.ID}`, this.selectedGroup)
          .then((resp) => {
            //this.groups = resp.data;
          })
          .finally(() => {
            this.isLoading = false;
          });

        m.notify({ text: "Group saved", variant: "success" });
        this.getAllGroups();
        this.unselectGroup();
      }
    },
    async deleteGroup() {
      this.isLoading = true;
      let api = useApiStore();

      if (this.selectedGroup) {
        await api
          .secureCall("delete", `${GROUPS_URL}/${this.selectedGroup.ID}`)
          .then(async (resp) => {
            this.unselectGroup();
          })
          .finally(() => {
            this.isLoading = false;
          });

        m.notify({ text: "Group deleted", variant: "success" });
        this.getAllGroups();
      }
    },
    async addGroup(user: any) {
      let api = useApiStore();

      return api.secureCall("post", GROUPS_URL, user).then(async (resp) => {
        await this.getAllGroups();
        return resp.data;
      });
    },
  },
});

export interface DemographicGroup {
  ID: number;
  SID: number;
  NAME: string;

  values?: DemographicGroupValue[];
  survey?: Survey;
}
export interface DemographicGroupValue {
  ID?: number;
  DEMOGRAPHIC_GROUP_ID: number;
  DEMOGRAPHIC: string;
  NVALUE: number | null;
  TVALUE: string | null;
}
