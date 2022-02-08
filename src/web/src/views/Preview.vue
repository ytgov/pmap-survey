<template>
  <div class="hello">
    <h1>{{ title }}</h1>
    <p>
      The URL you use to reach this site appears to be incorrect
    </p>

  </div>
</template>

<script>
import * as config from "../config";
import store from "../store";

export default {
  name: "Login",
  data: () => ({
    title: `Welcome to ${config.applicationName}`,
  }),
  async created() {
    let surveyId = 1;

    await store.dispatch("loadSurveyw", surveyId);
  },
};
</script>
