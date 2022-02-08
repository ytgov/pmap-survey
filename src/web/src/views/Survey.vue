<template>
  <div class="hello">
    <h1>You have been asked to complete {{ survey.survey.NAME }}</h1>
    <p>{{ survey.survey.DESCRIPTION }}</p>

    <h4 class="mb-4">This survey consists of {{survey.questions.length}} questions. Once completed, please press 'Submit' at the bottom.</h4>

    <div v-for="(question, idx) of survey.questions" :key="idx">
      <question-renderer :index="idx" :question="question"></question-renderer>
    </div>

    <v-btn color="primary">Submit</v-btn>
  </div>
</template>

<script>
import * as config from "../config";
import store from "../store";

export default {
  name: "Login",
  computed: {
    survey: function () {
      return store.getters.survey;
    },
  },
  data: () => ({
    title: `Welcome to ${config.applicationName}`,
  }),
  async created() {
    let surveyId = this.$route.params.token;

    await store.dispatch("loadSurvey", surveyId);
  },
};
</script>

<style scoped>
li {
  margin-bottom: 15px;
}
</style>
