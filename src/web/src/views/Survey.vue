<template>
  <div class="hello">
    <h1>You have been asked to complete {{ survey.survey.NAME }}</h1>
    <p>{{ survey.survey.DESCRIPTION }}</p>

    <div v-if="!moveOn">
      <v-card class="default">
        <v-card-text>
          <p>
            Your participation in this survey is completely voluntary. Your
            answers are kept securely on a Government of Yukon server and is
            stored in an non-identifiable format.
          </p>
          <p>
            Only non-identifiable and aggregated informtion will be used in
            reporting results. By participation in this survey, you agree that
            the information can be used inform on business improvement and more
            efficient general public service program planning.
          </p>
          <p>
            If you have any questions about the collection, use or disclosure of
            your personal information, contact the Director, People, Metrics,
            Analytics and Projects Branch at (867) 332-2738 or in person at:
          </p>
          <p class="ml-3">
            Main Administration Building, <br />2071 2nd Ave.<br />
            Whitehorse YT, Y1A 1B2
          </p>

          <v-btn @click="moveOn = true" large color="primary"
            >Continue to Survey</v-btn
          ></v-card-text
        >
      </v-card>
    </div>

    <div v-if="moveOn">
      <h4 class="mb-4">
        This survey consists of {{ survey.questions.length }} questions. Once
        completed, please press 'Submit' at the bottom.
      </h4>

      <div v-for="(question, idx) of survey.questions" :key="idx">
        <question-renderer
          :index="idx"
          :question="question"
        ></question-renderer>
      </div>

      <v-btn color="primary" :disabled="!allValid" @click="submitSurvey"
        >Submit</v-btn
      >
    </div>
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
    moveOn: false,
  }),
  mounted() {
    this.surveyId = this.$route.params.token;
    store.dispatch("loadSurvey", this.surveyId).catch((msg) => {
      console.log("ERROR ON SURVEY GET: ", msg);
      this.$router.push(`/survey/not-found`);
    });
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
          delete q.ORD;
          delete q.SID;
          delete q.TYPE;
          qs.push(q);

          console.log(q);
        }

        axios
          .post(`${SURVEY_URL}/${this.surveyId}`, { questions: qs })
          .then(() => {
            this.$router.push("/survey/complete");
          })
          .catch((msg) => {
            console.log("ERRROR", msg);
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
