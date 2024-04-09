<template>
  <div class="hello" v-if="survey && survey.survey && survey.survey.PAGE_TITLE">
    <h1>{{ survey.survey.PAGE_TITLE }}</h1>
    <div
      class="markdown"
      v-if="renderMarkdown(survey.survey.DESCRIPTION).isMarkdown"
      v-html="renderMarkdown(survey.survey.DESCRIPTION).output"></div>

    <p class="lead" style="font-size: 1.2rem; font-weight: 300" v-else>
      {{ survey.survey.DESCRIPTION }}
    </p>

    <div v-if="!moveOn">
      <v-card class="default">
        <v-card-text>
          <div
            class="markdown"
            v-html="renderMarkdown(survey.survey.PAGE_INTRO).output"
            v-if="renderMarkdown(survey.survey.PAGE_INTRO).isMarkdown"></div>
          <p v-else>{{ survey.survey.PAGE_INTRO }}</p>

          <v-btn @click="moveOn = true" large color="primary">Continue to Survey</v-btn>
        </v-card-text>
      </v-card>
    </div>

    <div v-if="moveOn">
      <h4 class="mb-4">
        This survey consists of {{ questionCount }} questions. Once completed, please press 'Submit' at the bottom.
      </h4>
      <div class="row">
        <div class="col-sm-12 col-md-9 col-lg-7">
          <div v-for="(question, idx) of questionGroups" :key="idx">
            <question-renderer
              :index="getQuestionNumber(question)"
              :question="question"
              @answerChanged="checkAllValid"
              v-if="question.isVisible"></question-renderer>
          </div>

          <div v-if="survey.survey.CONTACT_QUESTION">
            <v-card class="default mb-5 question">
              <v-card-title class="pb-0" style="min-height: 48px">
                <v-row>
                  <v-col cols="12" class="pb-1" style="line-height: 24px"> Regarding this survey... </v-col>
                </v-row>
              </v-card-title>
              <v-card-text style="clear: both">
                <v-checkbox :label="survey.survey.CONTACT_QUESTION" v-model="contactMe"></v-checkbox>
              </v-card-text>
            </v-card>
          </div>
        </div>
      </div>
      <v-btn color="primary" :disabled="!allValid" @click="submitSurvey"> Submit </v-btn>

      <span style="font-size: 0.9rem" class="pl-4 text-error" v-if="!allValid">
        * Not all required questions have answers (look for the red asterisks next to the question)
      </span>
    </div>
  </div>
</template>

<script>
import { clone } from "lodash";
import { mapActions, mapState } from "pinia";
import { useSurveyStore } from "@/store/SurveyStore";
import { RenderMarkdown } from "@/utils";

export default {
  name: "Login",
  data: () => ({
    surveyId: "",
    moveOn: false,
    allValid: false,
    contactMe: false,
  }),
  computed: {
    ...mapState(useSurveyStore, ["survey"]),

    questionCount() {
      const ignoreTypes = ["text", "title_question"];
      return this.survey.questions.filter((q) => !ignoreTypes.includes(q.TYPE)).length;
    },
    questionGroups() {
      let list = [];

      if (this.survey.questions) {
        let lastTitle = null;
        for (let question of this.survey.questions) {
          if (question.TYPE == "title_question") {
            question.subQuestions = [];
            lastTitle = question;
            list.push(question);
          } else if (question.TYPE == "matrix_question") {
            if (lastTitle) lastTitle.subQuestions.push(question);
          } else if (question.TYPE == "quadrant_title") {
            question.subQuestions = [];
            lastTitle = question;
            list.push(question);
          } else if (question.TYPE == "quadrant") {
            if (lastTitle) lastTitle.subQuestions.push(question);
          } else {
            list.push(question);
          }
        }
      }
      return list;
    },
  },
  mounted() {
    this.surveyId = this.$route.params.token;
    this.loadSurveyPreview(this.surveyId).catch((msg) => {
      console.log("ERROR ON SURVEY GET: ", msg);
      this.$router.push(`/survey/not-found`);
    });
  },
  methods: {
    ...mapActions(useSurveyStore, ["loadSurveyPreview"]),

    checkAllValid() {
      let v = true;

      for (let q of this.survey.questions) {
        q.isVisible = q.checkConditions();
        let qv = q.isValid();
        v = v && qv;
      }

      this.allValid = v;
      return v;
    },
    submitSurvey() {
      if (this.allValid) {
        let qs = [];
        for (let sq of this.survey.questions) {
          let q = clone(sq);
          delete q.ASK;
          delete q.RANGE;
          delete q.SELECTION_JSON;
          delete q.OPTIONAL;
          delete q.ORD;
          delete q.SID;
          delete q.TYPE;
          qs.push(q);
        }

        console.log("SUBMIT", qs);

        localStorage.clear();

        alert("Submitting does nothing on preview");
      }
    },
    renderMarkdown(input) {
      return RenderMarkdown(input);
    },
    getQuestionNumber(question) {
      let index = 0;
      for (let q of this.survey.questions) {
        if (q.QID == question.QID) return index;

        if (q.isVisible && q.TYPE != "matrix_question") index++;
      }

      return index;
    },
  },
};
</script>

<style scoped>
li {
  margin-bottom: 15px;
}
</style>
