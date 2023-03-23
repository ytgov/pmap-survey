<template>
  <div class="hello">
    <h1>{{ survey.survey.PAGE_TITLE }}</h1>
    <p class="lead" style="font-size: 1.2rem; font-weight: 300">
      {{ survey.survey.DESCRIPTION }}
    </p>

    <div v-if="!moveOn">
      <v-card class="default">
        <v-card-text>
          <div v-html="survey.survey.PAGE_INTRO"></div>

          <!--
            <p>
            Your participation in this survey is voluntary, and you may submit
            your responses only once.
          </p>

          <p>
            Your answers are kept securely on a Yukon Government server and are
            stored in a non-identifiable format.
          </p>

          <p>
            Only non-identifiable and aggregated information will be used when
            reporting results. By participating in this survey, you consent that
            your information can be used to inform business improvement and
            program planning initiatives towards creating a more efficient
            public service.
          </p>

          <p>
            If you have any questions about the collection, use or disclosure of
            your personal information, contact the Director, People Metrics,
            Analytics and Projects Branch at (867) 332-2738 or in person at:
          </p>

          <p class="ml-3">
            Main Administration Building, <br />2071 2nd Ave.<br />
            Whitehorse YT, Y1A 1B2
          </p>
          -->

          <v-btn @click="moveOn = true" large color="primary">Continue to Survey</v-btn></v-card-text
        >
      </v-card>
    </div>

    <div v-if="moveOn">
      <h4 class="mb-4">
        This survey consists of {{ survey.questions.length }} questions. Once completed, please press 'Submit' at the
        bottom.
      </h4>

      <div class="row">
        <div class="col-sm-12 col-md-9 col-lg-7">
          <div v-for="(question, idx) of survey.questions" :key="idx">
            <question-renderer :index="idx" :question="question"></question-renderer>
          </div>

          <div v-if="survey.survey.CONTACT_QUESTION">
            <v-card class="default mb-5 question">
              <v-card-title class="pb-0" style="min-height: 48px">
                <v-row>
                  <v-col cols="12" class="pb-1" style="line-height: 24px">
                    Regarding this survey...
                  </v-col>
                </v-row>
              </v-card-title>
              <v-card-text style="clear: both">
                <v-checkbox :label="survey.survey.CONTACT_QUESTION" v-model="contactMe"></v-checkbox>
              </v-card-text>
            </v-card>
          </div>
        </div>
      </div>

      <v-btn color="primary" :disabled="!allValid" @click="submitSurvey">
        Submit
      </v-btn>

      <span style="font-size: 0.9rem" class="pl-4 text-error" v-if="!allValid">
        * Not all required questions have answers (look for the red asterisks next to the question)
      </span>
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
    survey: function() {
      return store.getters.survey;
    },
    allValid: function() {
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
    contactMe: false,
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
        }

        axios
          .post(`${SURVEY_URL}/${this.surveyId}`, { questions: qs, contact: this.contactMe })
          .then(() => {
            //this.$router.push("/survey/complete");
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
