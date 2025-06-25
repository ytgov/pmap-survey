import { defineStore } from "pinia";

import { useNotificationStore } from "@/store/NotificationStore";
import { useApiStore } from "@/store/ApiStore";
import { LINKS_URL } from "@/urls";
import { Survey } from "../../emailer/store";
import { DemographicGroup } from "../../demographic-group/store";

let m = useNotificationStore();

interface AdminState {
  links: Array<SurveyLink>;
  selectedLink: SurveyLink | undefined;
  isLoading: boolean;
}

export const useLinksAdminStore = defineStore("linksAdmin", {
  state: (): AdminState => ({
    links: [],
    isLoading: false,
    selectedLink: undefined,
  }),
  getters: {
    linkCount(state) {
      if (state && state.links) return state.links.length;
      return 0;
    },
  },
  actions: {
    async loadLinks() {
      this.isLoading = true;
      let api = useApiStore();
      await api
        .secureCall("get", LINKS_URL)
        .then((resp) => {
          this.links = resp.data;
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    selectLink(link: any) {
      this.selectedLink = link;
    },
    unselectLink() {
      this.selectedLink = undefined;
    },
    async addLink(surveyId: number, groupId?: number | null) {
      let api = useApiStore();

      return api.secureCall("post", LINKS_URL, { surveyId, groupId }).then(async (resp) => {
        await this.loadLinks();
        return resp.data;
      });
    },
    async deleteLink(id: number) {
      let api = useApiStore();

      return api.secureCall("delete", `${LINKS_URL}/${id}`).then(async (resp) => {
        await this.loadLinks();
        this.unselectLink();
        return resp.data;
      });
    },
  },
});

export interface SurveyLink {
  ID: number;
  SID: number;
  DEMOGRAPHIC_GROUP_ID?: number | null;
  SL_TOKEN: string;

  survey?: Survey;
  group?: DemographicGroup;
}
