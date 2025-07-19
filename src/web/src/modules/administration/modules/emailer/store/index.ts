import { defineStore } from "pinia";

import { useNotificationStore } from "@/store/NotificationStore";
import { useApiStore } from "@/store/ApiStore";
import { ADMIN_SURVEY_URL } from "@/urls";
import { isUndefined } from "lodash";

let api = useApiStore();

export const useEmailerStore = defineStore("emailer", {
  state: (): EmailerStore => ({
    survey: undefined,
    isLoading: false,
    email: { subject: "", body: "", recipientType: "SEND", demographicGroup: null },
  }),
  getters: {
    responseCount(state) {
      return 122;
    },
    moderateCount(state) {
      return 2;
    },
    emailValid(state): boolean {
      return (
        !isUndefined(state.survey) &&
        state.email.subject.length > 0 &&
        state.email.body.length > 0 &&
        !isUndefined(state.email.recipientType)
      );
    },
  },
  actions: {
    async initialize() {},

    async sendTest() {
      if (this.survey && this.emailValid) {
        let m = useNotificationStore();

        await api
          .secureCall("post", `${ADMIN_SURVEY_URL}/${this.survey}/send-email-test`, { ...this.email })
          .then(async (resp) => {
            m.notify({ variant: "success", text: "Email sent" });
          })
          .catch();
      }
    },
    async sendEmail() {
      if (this.survey && this.emailValid) {
        let m = useNotificationStore();

        await api
          .secureCall("post", `${ADMIN_SURVEY_URL}/${this.survey}/send-email`, {
            ...this.email,
          })
          .then(async (resp) => {
            m.notify({ variant: "success", text: resp.data });
          })
          .catch();
      }
    },
    select(item: number) {
      this.survey = item;
    },
    unselect() {
      this.survey = undefined;
      this.email = { subject: "", body: "", recipientType: "SEND", demographicGroup: null };
    },
  },
});

export interface EmailerStore {
  survey: number | undefined;
  isLoading: boolean;
  email: Email;
}

export interface Survey {
  SID?: number;
  NAME: string;
}

export interface Email {
  subject: string;
  body: string;
  recipientType: string;
  demographicGroup: number | null;
}
