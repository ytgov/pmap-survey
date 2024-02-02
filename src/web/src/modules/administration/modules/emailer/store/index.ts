import { defineStore } from "pinia";

import { useNotificationStore } from "@/store/NotificationStore";
import { useApiStore } from "@/store/ApiStore";
import { SURVEY_URL } from "@/urls";
import { isUndefined } from "lodash";

let api = useApiStore();

export const useEmailerStore = defineStore("emailer", {
  state: (): QuestionStore => ({
    questions: new Array<Question>(),
    question: undefined,
    isLoading: false,
    eventLog: new Array<Event>(),
    email: { subject: "", body: "", recipients: [] },
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
    emailValid(state): boolean {
      return (
        !isUndefined(state.question) &&
        state.email.subject.length > 0 &&
        state.email.body.length > 0 &&
        state.email.recipients.length > 0
      );
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
    async loadEvents() {
      if (this.question) {
        await api
          .secureCall("get", `${SURVEY_URL}/${this.question.ID}/events`)
          .then((resp) => {
            this.eventLog = resp.data;
          })
          .catch();
      } else {
        this.eventLog = new Array<Event>();
      }
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
    async sendTest() {
      if (this.question && this.emailValid) {
        let m = useNotificationStore();

        await api
          .secureCall("post", `${SURVEY_URL}/${this.question.ID}/send-email-test`, { ...this.email })
          .then(async (resp) => {
            //await this.loadQuestions();
            await this.loadEvents();
            m.notify({ variant: "success", text: "Email sent" });
          })
          .catch();
      }
    },
    async sendEmail() {
      if (this.question && this.emailValid) {
        let m = useNotificationStore();

        await api
          .secureCall("post", `${SURVEY_URL}/${this.question.ID}/send-email`, { ...this.email })
          .then(async (resp) => {
            //await this.loadQuestions();
            m.notify({ variant: "success", text: "Email sent" });
          })
          .catch();
      }
    },
    select(item: Question) {
      this.question = item;
    },
    unselect() {
      this.question = undefined;
      this.email = { subject: "", body: "", recipients: [] };
    },
  },
});

export interface QuestionStore {
  questions: Question[];
  question: Question | undefined;
  isLoading: boolean;
  eventLog: Event[];
  email: Email;
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
}

export interface Event {
  ID?: number;
  TITLE: string;
  CREATE_DATE: Date;
  QUESTION_ID: number;
  user: { display_name: string };
}

export interface Email {
  subject: string;
  body: string;
  recipients: string[];
}
