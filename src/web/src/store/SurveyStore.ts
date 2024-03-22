import { defineStore } from "pinia";
import { SURVEY_URL } from "@/urls";
import { useApiStore } from "./ApiStore";

export const useSurveyStore = defineStore("survey", {
  state: () => ({
    survey: { survey: {}, questions: [] },
    isLoading: false,
  }),
  actions: {
    async initialize() {},

    async loadSurvey(id: any) {
      this.isLoading = true;
      let api = useApiStore();

      await api
        .call("get", `${SURVEY_URL}/${id}`)
        .then((resp) => {
          this.setSurvey(resp.data);
        })
        .finally(() => {
          this.isLoading = false;
        });
    },

    async loadSurveyPreview(id: any) {
      this.isLoading = true;
      let api = useApiStore();

      await api
        .call("get", `${SURVEY_URL}/${id}/preview`)
        .then((resp) => {
          this.setSurvey(resp.data);
        })
        .finally(() => {
          this.isLoading = false;
        });
    },

    setSurvey(value: any) {
      for (let q of value.questions) {
        q.answer = null;
        q.isValid = () => {
          if (q.OPTIONAL == 1) return true;
          if (q.TYPE == "text") return true;
          if (!q.isVisible) return true;

          if (q.subQuestions) {
            for (let sub of q.subQuestions) {
              if (!sub.isValid()) return false;
            }
            return true;
          }

          if (q.TYPE == "matrix_question") {
            return q.answer && q.answer != false;
          }

          let trimAnswer = `${q.answer}`.replace("null", "").trim();
          if (trimAnswer && trimAnswer.length > 0) return true;
          return false;
        };
        q.isVisible = true;
        q.checkConditions = () => {
          let newVisible = true;

          for (let cond of q.conditions) {
            let parentQuestion = value.questions.find((q: any) => q.QID == cond.CQID);

            if (parentQuestion && parentQuestion.answer) {
              if (parentQuestion.answer == cond.TVALUE) {
              } else {
                newVisible = false;
              }
            } else {
              newVisible = false;
            }
          }
          return newVisible;
        };
      }

      this.survey = value;
    },
  },
});
