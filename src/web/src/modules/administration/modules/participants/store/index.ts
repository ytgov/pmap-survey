import { defineStore } from "pinia";

import { useNotificationStore } from "@/store/NotificationStore";
import { useApiStore } from "@/store/ApiStore";
import { ADMIN_SURVEY_URL, PARTICIPANT_URL } from "@/urls";

let m = useNotificationStore();
let api = useApiStore();

export const useParticipantsStore = defineStore("participants", {
  state: (): ParticipantStore => ({
    isLoading: false,
    responses: new Array<Response>(),
    batch: { participants: "", survey: undefined, addresses: [], prefix: "", fileData: {} },
    participants: new Array<any>(),
  }),
  getters: {
    batchIsValid(state) {
      return state.batch.survey && state.batch.addresses && state.batch.addresses.length > 0;
    },
  },
  actions: {
    async initialize() {},
    async loadResponses() {},

    parse(strict: boolean = false): { valid: string[]; invalid: string[] } {
      this.batch.addresses = [];

      let results = { valid: new Array<string>(), invalid: new Array<string>() };

      if (this.batch && this.batch.participants) {
        let list = this.batch.participants.toLowerCase().trim();
        let array = list.split(/[\s\,]/gi).filter((s: string) => s.length > 0);

        for (let item of array) {
          item = item.trim().replace(/;/g, "");
          let t = new RegExp(/^[\w\-\.]+@([\w-]+\.)+[\w-]{2,}$/g).test(item);
          if (t) results.valid.push(item);
          else results.invalid.push(item);
        }
      }

      if (strict) {
        if (results.invalid.length == 0) this.batch.addresses = results.valid;
        else {
          m.notify({ text: "This file has invalid email addresses", variant: "error" });
        }
      } else {
        this.batch.addresses = results.valid;
      }

      return results;
    },

    async create() {
      this.parse();

      if (this.batch.addresses.length == 0) return;

      await api.secureCall("post", PARTICIPANT_URL, this.batch).then(async (resp) => {
        await this.loadResponses();
        await this.getParticipants(this.batch.survey);

        if (resp.error) {
          m.notify({ text: resp.error.response.data, variant: "error" });
        } else {
          m.notify({ text: "Participants saved", variant: "success" });
          //this.unselect();
        }
      });
    },
    async update() {
      if (this.batch) {
        await api
          .secureCall("put", `${PARTICIPANT_URL}/${this.batch.SID}`, this.batch)
          .then(async (resp) => {
            await this.loadResponses();
            await this.getParticipants(this.batch.survey);
            m.notify({ text: "Participants saved", variant: "success" });
          })
          .catch();
      }
    },
    select(item: Response) {
      this.batch = item;
    },
    unselect() {
      this.batch = { participants: "", survey: undefined, addresses: [], prefix: "" };
      this.participants = new Array<any>();
    },

    async getParticipants(surveyId: number, demographicGroup: number | null = null) {
      await api
        .secureCall("get", `${PARTICIPANT_URL}/${surveyId}/${demographicGroup}`)
        .then(async (resp) => {
          this.participants = resp.data;
        })
        .catch();
    },

    async deleteParticipant(surveyId: number, id: number) {
      await api
        .secureCall("delete", `${PARTICIPANT_URL}/${id}`)
        .then(async (resp) => {
          this.getParticipants(surveyId);
          m.notify({ variant: "success", text: "Participant removed" });
        })
        .catch();
    },

    async deleteStaleParticipants(surveyId: number) {
      await api
        .secureCall("delete", `${PARTICIPANT_URL}/${surveyId}/stale`)
        .then(async (resp) => {
          this.getParticipants(surveyId);
          m.notify({ variant: "success", text: "Participants removed" });
        })
        .catch();
    },

    async manualSend(surveyId: number, id: number) {
      await api
        .secureCall("post", `${ADMIN_SURVEY_URL}/${surveyId}/resend/${id}`)
        .then(async (resp) => {
          m.notify({ variant: "success", text: "Email sent" });
        })
        .catch();
    },
  },
});

export interface ParticipantStore {
  isLoading: boolean;
  responses: Response[];
  batch: any | undefined;
  participants: any[];
}

export interface Response {
  SID: number;
  question: string;
  date: string;
  status: string;
  answer: string;
  answer_moderated: string;
}
