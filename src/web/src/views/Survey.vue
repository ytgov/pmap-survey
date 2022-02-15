<template>
  <div class="hello">
    <h1>You have been asked to complete {{ survey.survey.NAME }}</h1>
    <p>{{ survey.survey.DESCRIPTION }}</p>

    <h4 class="mb-4">
      This survey consists of {{ survey.questions.length }} questions. Once
      completed, please press 'Submit' at the bottom.
    </h4>

    <div v-for="(question, idx) of survey.questions" :key="idx">
      <question-renderer :index="idx" :question="question"></question-renderer>
    </div>

    <v-btn color="primary" :disabled="!allValid" @click="submitSurvey"
      >Submit</v-btn
    >
  </div>
</template>

<script>
import axios from "axios";
import store from "../store";
import { SURVEY_URL } from "../urls";
import _ from "lodash";

export default {
  name: "Login",
  computed: {
    survey: function () {
      return store.getters.survey;
    },
    allValid: function () {
      let v = true;

      for (let q of this.survey.questions) {
        let qv = q.isValid();
        v = v && qv;
      }

      return v;
    },
  },
  data: () => ({
    surveyId: "",
  }),
  async created() {
    this.surveyId = this.$route.params.token;
    await store.dispatch("loadSurvey", this.surveyId);
  },
  methods: {
    submitSurvey() {
      if (this.allValid) {
        let qs = [];

        for (let sq of this.survey.questions) {
          let q = _.clone(sq);

          delete q.ASK;
          delete q.RANGE;
          delete q.SELECTION_JSON;
          delete q.OPTIONAL;
          delete q.ORDER;
          delete q.SID;
          delete q.TYPE;
          qs.push(q);

          console.log(q)
        }

        axios
          .post(`${SURVEY_URL}/${this.surveyId}`, { questions: qs })
          .then(() => {
            this.$router.push("/survey/complete");
          });
      }
    },
  },
};
</script>

<style scoped>
li {
  margin-bottom: 15px;
}
</style>
