import { defineStore } from "pinia";
import { useApiStore } from "@/store/ApiStore";
import { ADMIN_SURVEY_URL } from "@/urls";

let api = useApiStore();

export const useAdminResultsStore = defineStore("adminResults", {
  state: () => ({
    results: undefined,
    result: undefined as any,
    isLoading: false,

    questionTypes: [],
  }),
  getters: {},
  actions: {
    async initialize() {},
    async loadResults() {
      await api
        .secureCall("get", ADMIN_SURVEY_URL)
        .then((resp) => {
          this.results = resp.data.filter((r: any) => r.STATUS != "Hidden");
        })
        .catch();

      await api.secureCall("get", `${ADMIN_SURVEY_URL}/question-types`).then((resp) => {
        this.questionTypes = resp.data;
      });
    },
    async select(SID: number) {
      await api
        .secureCall("get", `${ADMIN_SURVEY_URL}/results/${SID}`)
        .then((resp) => {
          this.result = resp.data;
        })
        .catch();
    },
  },
});
