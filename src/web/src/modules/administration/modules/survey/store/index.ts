import { defineStore } from "pinia";

import { useNotificationStore } from "@/store/NotificationStore";
import { useApiStore } from "@/store/ApiStore";
import { useUserStore } from "@/store/UserStore";
import { ADMIN_SURVEY_URL } from "@/urls";
import { clone, cloneDeep } from "lodash";

let notify = useNotificationStore();
let api = useApiStore();

export const useAdminSurveyStore = defineStore("adminSurvey", {
  state: (): AdminSurveyState => ({
    surveys: new Array<Survey>(),
    survey: undefined,
    isLoading: false,

    questionTypes: [],
    selectedChoices: {},
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
    quadrantOptions(state) {
      if (state.survey) return state.survey.questions?.filter((q) => q.TYPE == "quadrant_title");
      return [];
    },
    activeSurveys(state) {
      if (state && state.surveys) return state.surveys.filter((s) => s.STATUS != "Hidden");
    },
    hiddenSurveys(state) {
      if (state && state.surveys) return state.surveys.filter((s) => s.STATUS == "Hidden");
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
          notify.notify("Survey Created");
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
            this.selectById(this.survey?.SID || 0);
            notify.notify("Survey Saved");
          })
          .catch();
      }
    },
    async delete() {
      if (this.survey) {
        return await api
          .secureCall("delete", `${ADMIN_SURVEY_URL}/${this.survey.SID}`, this.survey)
          .then(async (resp) => {
            if (resp.error) {
              notify.notify({ variant: "error", text: `Delete failed - ${resp.error}` });
              return false;
            } else {
              await this.loadSurveys();
              notify.notify("Survey Removed");
              return true;
            }
          })
          .catch();
      }
    },
    async select(item: any) {
      this.survey = item;

      if (this.survey) {
        let needsSave = false;

        let index = 1;
        for (let question of this.survey.questions || []) {
          if (question.ORD != index) {
            question.ORD = index;
            needsSave = true;
            await this.saveQuestionOrder(question);
          }

          index++;
        }

        if (needsSave) {
          notify.notify("Question Order Repaired");
        }
      }
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

    async addQuestion() {
      if (this.survey && this.survey.SID) {
        this.survey.questions = this.survey.questions || [];

        let newQuestion = {
          SID: this.survey.SID,
          ASK: "New Question",
          OPTIONAL: 0,
          TYPE: "boolean",
          ORD: this.survey.questions.length + 1,
        };

        await this.saveQuestion(newQuestion as any);
      }
    },

    async moveUp(index: number) {
      if (this.survey && this.survey.questions) {
        let item = this.survey.questions[index];
        let prev = this.survey.questions[index - 1];

        let prevOrd = prev.ORD;
        prev.ORD = item.ORD;
        item.ORD = prevOrd;

        await this.saveQuestionOrder(item);
        await this.saveQuestionOrder(prev);

        await this.loadSurveys();
        this.selectById(this.survey?.SID || 0);
      }
    },

    async moveDown(index: number) {
      if (this.survey && this.survey.questions) {
        let item = this.survey.questions[index];
        let next = this.survey.questions[index + 1];

        let prevOrd = next.ORD;
        next.ORD = item.ORD;
        item.ORD = prevOrd;

        await this.saveQuestionOrder(item);
        await this.saveQuestionOrder(next);

        await this.loadSurveys();
        this.selectById(this.survey?.SID || 0);
      }
    },

    async saveQuestionOrder(question: { QID?: number }) {
      if (this.survey) {
        await api
          .secureCall("put", `${ADMIN_SURVEY_URL}/${this.survey.SID}/question/${question.QID}/order`, question)
          .then(async (resp) => {})
          .catch();
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
              notify.notify("Question Saved");
            })
            .catch();
        } else {
          await api
            .secureCall("post", `${ADMIN_SURVEY_URL}/${this.survey.SID}/question`, question)
            .then(async (resp) => {
              await this.loadSurveys();
              this.selectById(this.survey?.SID || 0);
              notify.notify("Question Added");
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
            notify.notify("Question Removed");
          })
          .catch();
      }
    },

    async saveQuestionConditions(question: { QID: number; conditions: any[] }) {
      let conditions = question.conditions;

      if (this.survey) {
        await api
          .secureCall("put", `${ADMIN_SURVEY_URL}/${this.survey.SID}/question/${question.QID}/conditions`, {
            conditions,
          })
          .then(async (resp) => {
            await this.loadSurveys();
            this.selectById(this.survey?.SID || 0);
            notify.notify("Conditions Saved");
          })
          .catch();
      }
    },

    selectChoice(choices: any) {
      this.selectedChoices = cloneDeep(choices);
    },

    async saveSurveyChoices() {
      if (this.survey) {
        await api
          .secureCall("put", `${ADMIN_SURVEY_URL}/${this.survey.SID}/choices`, {
            choices: this.selectedChoices,
          })
          .then(async (resp) => {
            await this.loadSurveys();
            this.selectById(this.survey?.SID || 0);
            notify.notify("Choice List Saved");
          })
          .catch();
      }
    },

    async deleteChoices(item: any) {
      if (this.survey) {
        await api
          .secureCall("delete", `${ADMIN_SURVEY_URL}/${this.survey.SID}/choices/${item.JSON_ID}`)
          .then(async (resp) => {
            await this.loadSurveys();
            this.selectById(this.survey?.SID || 0);
            notify.notify("Choice List Removed");
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
  selectedChoices: any;
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
  FROM_EMAIL?: string;
  ALLOW_AUDIT: number;
  ALLOW_DEMOGRAPHIC_GROUP?: number;
  ALLOW_AUTO_PARTICIPANT?: number;
  NO_LOCAL_STORAGE?: number;
  STATUS: string;
  questions?: Question[];
  choices?: any[];
  responses?: any[];
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
