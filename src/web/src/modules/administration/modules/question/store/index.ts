import { defineStore } from "pinia";

import { useNotificationStore } from "@/store/NotificationStore";
import { useApiStore } from "@/store/ApiStore";
import { SURVEY_URL } from "@/urls";
import { useUserStore } from "@/store/UserStore";

let m = useNotificationStore();
let api = useApiStore();

export const useQuestionStore = defineStore("question", {
  state: (): QuestionStore => ({
    questions: new Array<Question>(),
    question: undefined,
    isLoading: false,
    stateOptions: [
      { value: 0, title: "Draft" },
      { value: 1, title: "Opinionate" },
      { value: 2, title: "Inspire" },
      { value: 3, title: "Rate" },
      { value: 4, title: "Closed" },
      { value: 5, title: "Publish" },
    ],
  }),
  getters: {
    questionCount(state) {
      if (state && state.questions) return state.questions.length;
      return 0;
    },
    responseCount(state) {
      return 122;
    },
    moderateCount(state) {
      return 2;
    },
    myQuestions(state) {
      let u = useUserStore();
      let myQ = state.questions.filter((q) => q.moderators && q.moderators.indexOf(u.user.EMAIL) >= 0);
      return myQ;
    },
  },
  actions: {
    async initialize() {},
    async loadQuestions() {
      await api
        .secureCall("get", SURVEY_URL)
        .then((resp) => {
          this.questions = resp.data;
        })
        .catch();
    },
    async create() {
      await api
        .secureCall("post", SURVEY_URL, this.question)
        .then(async (resp) => {
          await this.loadQuestions();
        })
        .catch();
    },
    async update() {
      if (this.question) {
        await api
          .secureCall("put", `${SURVEY_URL}/${this.question.ID}`, this.question)
          .then(async (resp) => {
            await this.loadQuestions();
          })
          .catch();
      }
    },
    async delete() {
      if (this.question) {
        await api
          .secureCall("delete", `${SURVEY_URL}/${this.question.ID}`, this.question)
          .then(async (resp) => {
            await this.loadQuestions();
          })
          .catch();
      }
    },
    select(item: Question) {
      this.question = item;
    },
    unselect() {
      this.question = undefined;
    },
    stateTitle(state: number) {
      return this.stateOptions[state].title;
    },
  },
});

export interface QuestionStore {
  questions: Question[];
  question: Question | undefined;
  isLoading: boolean;
  stateOptions: { value: number; title: string }[];
}

export interface Question {
  ID?: number;
  TITLE: string;
  DISPLAY_TEXT: string;
  CREATE_DATE: Date;
  OWNER: string;
  STATE: number;
  MAX_ANSWERS: number;
  RATINGS_PER_TRANCHE: number;
  CURRENT_RATING_TRANCHE: number;  
  MODERATABLE: number;
  QUESTION_NOUNCE?: string;
  ZERO_RATING_FLAG: number;

  moderators?: string[];
}

export enum QuestionState {
  Draft = 0,
  Opinionate = 1,
  Inspire = 2,
  Rate = 3,
  Closed = 4,
  Publish = 5,
}
