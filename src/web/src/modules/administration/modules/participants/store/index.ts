import { defineStore } from "pinia";

import { useNotificationStore } from "@/store/NotificationStore";
import { useApiStore } from "@/store/ApiStore";
import { PARTICIPANT_URL } from "@/urls";

let m = useNotificationStore();
let api = useApiStore();

export const useParticipantsStore = defineStore("participants", {
  state: (): ParticipantStore => ({
    isLoading: false,
    responses: new Array<Response>(),
    batch: { participants: "", participant_type: "Opinionator", question: undefined, addresses: [] },
    listTypes: ["Opinionator", "Rater"],
    participants: new Array<any>(),
  }),
  getters: {
    responseCount(state) {
      return 122;
    },
    batchIsValid(state) {
      return (
        state.batch.participant_type &&
        state.batch.participant_type.length > 0 &&
        state.batch.question &&
        state.batch.addresses &&
        state.batch.addresses.length > 0
      );
    },
    opinionators(state) {
      if (state.participants && state.participants.length > 0)
        return state.participants.filter((p) => p.IS_RESPONDER == 1);
      return [];
    },
    raters(state) {
      if (state.participants && state.participants.length > 0) return state.participants.filter((p) => p.IS_RATER == 1);
      return [];
    },
  },
  actions: {
    async initialize() {},
    async loadResponses() {},

    parse(): { valid: string[]; invalid: string[] } {
      let results = { valid: new Array<string>(), invalid: new Array<string>() };

      if (this.batch && this.batch.participants) {
        let list = this.batch.participants.toLowerCase().trim();
        let array = list.split(/[\s\,]/gi).filter((s: string) => s.length > 0);

        for (let item of array) {
          let t = new RegExp(
            /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
          ).test(item);
          if (t) results.valid.push(item);
          else results.invalid.push(item);
        }
      }

      this.batch.addresses = results.valid;

      return results;
    },

    async create() {
      this.parse();

      if (this.batch.addresses.length == 0) return;

      await api
        .secureCall("post", PARTICIPANT_URL, this.batch)
        .then(async (resp) => {
          await this.loadResponses();
          await this.getParticipants(this.batch.question);
          m.notify({ text: "Participants saved", variant: "success" });
        })
        .catch();
    },
    async update() {
      if (this.batch) {
        await api
          .secureCall("put", `${PARTICIPANT_URL}/${this.batch.SID}`, this.batch)
          .then(async (resp) => {
            await this.loadResponses();
            await this.getParticipants(this.batch.question);
            m.notify({ text: "Participants saved", variant: "success" });
          })
          .catch();
      }
    },
    select(item: Response) {
      this.batch = item;
    },
    unselect() {
      this.batch = { participants: "", participant_type: "Opinionator", question: undefined, addresses: [] };
      this.participants = new Array<any>();
    },

    async getParticipants(questionId: number) {
      await api
        .secureCall("get", `${PARTICIPANT_URL}/${questionId}`)
        .then(async (resp) => {
          this.participants = resp.data;
        })
        .catch();
    },

    async deleteParticipant(questionId: number, id: number) {
      await api
        .secureCall("delete", `${PARTICIPANT_URL}/${id}`)
        .then(async (resp) => {
          this.getParticipants(questionId);
          m.notify({ variant: "success", text: "Participant removed" });
        })
        .catch();
    },

    async getParticipantStats(questionId: number | undefined) {
      if (questionId)
        return api
          .secureCall("get", `${PARTICIPANT_URL}/${questionId}`)
          .then(async (resp) => {
            return {
              raters: resp.data.filter((r: any) => r.IS_RATER == 1).length,
              opinionators: resp.data.filter((r: any) => r.IS_RESPONDER == 1).length,
            };
          })
          .catch();

      return { raters: 0, opinionators: 0 };
    },
  },
});

export interface ParticipantStore {
  isLoading: boolean;
  responses: Response[];
  batch: any | undefined;
  listTypes: string[];
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
