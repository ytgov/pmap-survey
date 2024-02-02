import { defineStore } from "pinia";

import { useNotificationStore } from "@/store/NotificationStore";
import { useApiStore } from "@/store/ApiStore";
import { ANSWER_URL } from "@/urls";

let m = useNotificationStore();
let api = useApiStore();

export const useResponseStore = defineStore("response", {
  state: (): ResponseStore => ({
    responses: new Array<Response>(),
    response: undefined,
    currentQuestion: undefined,
  }),
  getters: {
    responseCount(state) {
      return state.responses.length;
    },
    moderatedResponseCount(state) {
      return state.responses.filter((r) => r.DONE_MODERATING == 1).length;
    },
    unmoderatedResponseCount(state) {
      return state.responses.filter((r) => r.DONE_MODERATING == 0).length;
    },
  },
  actions: {
    async initialize() {},
    async loadResponses() {
      this.currentQuestion = undefined;
      await api
        .secureCall("get", ANSWER_URL)
        .then((resp) => {
          this.responses = resp.data;
        })
        .catch();
    },
    async loadResponsesFor(questionId: number) {
      this.currentQuestion = questionId;
      await api
        .secureCall("get", ANSWER_URL)
        .then((resp) => {
          this.responses = resp.data.filter((d: Response) => d.QUESTION_ID == questionId);
        })
        .catch();
    },
    async update() {
      if (this.response) {
        await api
          .secureCall("put", `${ANSWER_URL}/${this.response.ID}`, this.response)
          .then(async (resp) => {
            if (this.currentQuestion) {
              await this.loadResponsesFor(this.currentQuestion);
            } else {
              await this.loadResponses();
            }
          })
          .catch();
      }
    },
    select(item: Response) {
      if (!item.MODERATED_TEXT || item.MODERATED_TEXT.length == 0) item.MODERATED_TEXT = item.ANSWER_TEXT;
      this.response = item;
    },
    unselect() {
      this.response = undefined;
    },

    totalCountForQuestion(QUESTION_ID: number | undefined) {
      if (QUESTION_ID) {
        return this.responses.filter((r) => r.QUESTION_ID == QUESTION_ID).length;
      }
      return 0;
    },
    moderatedCountForQuestion(QUESTION_ID: number | undefined) {
      if (QUESTION_ID) {
        return this.responses.filter((r) => r.QUESTION_ID == QUESTION_ID && r.DONE_MODERATING == 1).length;
      }
      return 0;
    },
    unmoderatedCountForQuestion(QUESTION_ID: number | undefined) {
      if (QUESTION_ID) {
        return this.responses.filter((r) => r.QUESTION_ID == QUESTION_ID && r.DONE_MODERATING == 0).length;
      }
      return 0;
    },
    ratingCountForQuestion(QUESTION_ID: number | undefined) {
      if (QUESTION_ID) {
        let questionResponses = this.responses.filter((r) => r.QUESTION_ID == QUESTION_ID);
        let totalCount = 0;

        for (let r of questionResponses) {
          totalCount +=
            (r.STAR0 || 0) + (r.STAR1 || 0) + (r.STAR2 || 0) + (r.STAR3 || 0) + (r.STAR4 || 0) + (r.STAR5 || 0);
        }

        return totalCount;
      }
      return 0;
    },
  },
});

export interface ResponseStore {
  responses: Response[];
  response: Response | undefined;
  currentQuestion: number | undefined;
}

export interface Response {
  ID: number;
  HEADING: string;
  ANSWER_TEXT: string;
  MODERATED_TEXT: string;
  CATEGORY: string;
  DELETED_FLAG: number;
  DONE_MODERATING: number;
  QUESTION_ID: number;
  MODERATOR_NOTES: string | undefined;
  STAR0?: number;
  STAR1?: number;
  STAR2?: number;
  STAR3?: number;
  STAR4?: number;
  STAR5?: number;
}
