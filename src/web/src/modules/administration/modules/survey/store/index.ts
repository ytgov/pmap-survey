import { defineStore } from "pinia";

import { useNotificationStore } from "@/store/NotificationStore";
import { useApiStore } from "@/store/ApiStore";
import { useUserStore } from "@/store/UserStore";
import { ADMIN_SURVEY_URL } from "@/urls";

let notify = useNotificationStore();
let api = useApiStore();

export const useAdminSurveyStore = defineStore("adminSurvey", {
  state: (): AdminSurveyState => ({
    surveys: new Array<Survey>(),
    survey: undefined,
    isLoading: false,

    questionTypes: [],
  }),
  getters: {
    surveyCount(state) {
      if (state && state.surveys) return state.surveys.length;
      return 0;
    },
    mySurveys(state) {
      let u = useUserStore();
      let myQ = state.surveys;
      return myQ;
    },
    groupOptions(state) {
      if (state.survey) return state.survey.questions?.filter((q) => q.TYPE == "title_question");
      return [];
    },
  },
  actions: {
    async initialize() {},
    async loadSurveys() {
      await api
        .secureCall("get", ADMIN_SURVEY_URL)
        .then((resp) => {
          this.surveys = resp.data;
        })
        .catch();

      await api.secureCall("get", `${ADMIN_SURVEY_URL}/question-types`).then((resp) => {
        this.questionTypes = resp.data;
      });
    },
    async create() {
      return await api
        .secureCall("post", ADMIN_SURVEY_URL, this.survey)
        .then(async (resp) => {
          await this.loadSurveys();
          return resp.data;
        })
        .catch();
    },
    async update() {
      if (this.survey) {
        await api
          .secureCall("put", `${ADMIN_SURVEY_URL}/${this.survey.SID}`, this.survey)
          .then(async (resp) => {
            await this.loadSurveys();
            notify.notify("Success");
          })
          .catch();
      }
    },
    async delete() {
      if (this.survey) {
        await api
          .secureCall("delete", `${ADMIN_SURVEY_URL}/${this.survey.SID}`, this.survey)
          .then(async (resp) => {
            await this.loadSurveys();
          })
          .catch();
      }
    },
    select(item: any) {
      this.survey = item;
    },
    selectById(id: number) {
      let item = this.surveys.find((s) => s.SID == id);
      if (item) {
        this.select(item);
      }
    },
    unselect() {
      this.survey = undefined;
    },

    addQuestion() {
      if (this.survey && this.survey.SID) {
        this.survey.questions = this.survey.questions || [];

        this.survey.questions.push({
          SID: this.survey.SID,
          ASK: "New Question",
          OPTIONAL: 0,
          TYPE: "boolean",
          ORD: this.survey.questions.length + 1,
        });
      }
    },
    async saveQuestion(question: { QID?: number }) {
      if (this.survey) {
        if (question.QID) {
          await api
            .secureCall("put", `${ADMIN_SURVEY_URL}/${this.survey.SID}/question/${question.QID}`, question)
            .then(async (resp) => {
              await this.loadSurveys();
              this.selectById(this.survey?.SID || 0);
            })
            .catch();
        } else {
          await api
            .secureCall("post", `${ADMIN_SURVEY_URL}/${this.survey.SID}/question`, question)
            .then(async (resp) => {
              await this.loadSurveys();
              this.selectById(this.survey?.SID || 0);
            })
            .catch();
        }
      }
    },
    async deleteQuestion(question: { QID: number }) {
      if (this.survey) {
        await api
          .secureCall("delete", `${ADMIN_SURVEY_URL}/${this.survey.SID}/question/${question.QID}`)
          .then(async (resp) => {
            await this.loadSurveys();
            this.selectById(this.survey?.SID || 0);
          })
          .catch();
      }
    },
  },
});

interface AdminSurveyState {
  surveys: Survey[];
  survey: Survey | undefined;
  isLoading: boolean;
  questionTypes: string[];
}

interface Survey {
  SID: number;
  NAME: string;
  DESCRIPTION: string;
  CREATE_DATE?: Date;
  PAGE_TITLE: string;
  PAGE_INTRO: string;
  CONTACT_QUESTION: string;
  CONTACT_EMAIL: string;
  EMAIL_SUBJECT?: string;
  EMAIL_BODY?: string;
  questions?: Question[];
  choices?: any[];
}

interface Question {
  QID?: number;
  SID: number;
  ASK: string;
  RANGE?: any;
  TYPE: string;
  OPTIONAL: number;
  ORD: number;
  JSON_ID?: number;
  GROUP_ID?: number;
  SELECT_LIMIT?: number;
}
