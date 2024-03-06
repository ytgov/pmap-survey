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
          console.log("CHECKING q", q)
          if (q.OPTIONAL == 1) return true;




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
          console.log("HERE2", q.answer, (trimAnswer && trimAnswer.length > 0))
          if (trimAnswer && trimAnswer.length > 0) return true;
          return false;
        };
      }

      this.survey = value;
    },
  },
});
