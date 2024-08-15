<template>
  <div v-if="isLoading">
    <v-skeleton-loader type="heading, subtitle, image"></v-skeleton-loader>
  </div>

  <div v-else-if="survey && survey.survey">
    <h1>{{ survey.survey.PAGE_TITLE }}</h1>
    <div
      class="markdown"
      v-if="renderMarkdown(survey.survey.DESCRIPTION).isMarkdown"
      v-html="renderMarkdown(survey.survey.DESCRIPTION).output"></div>

    <p class="lead" style="font-size: 1.2rem; font-weight: 300" v-else>
      {{ survey.survey.DESCRIPTION }}
    </p>

    <v-card class="default" v-if="!modelValue">
      <v-card-text>
        <div
          class="markdown"
          v-html="renderMarkdown(survey.survey.PAGE_INTRO).output"
          v-if="renderMarkdown(survey.survey.PAGE_INTRO).isMarkdown"></div>
        <p v-else>{{ survey.survey.PAGE_INTRO }}</p>

        <v-btn @click="emit('update:modelValue', true)" large color="primary">Continue to Survey</v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";

import { useSurveyStore } from "@/store/SurveyStore";
import { RenderMarkdown } from "@/utils";

const surveyStore = useSurveyStore();
const { survey, isLoading } = storeToRefs(surveyStore);

const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);

function renderMarkdown(input) {
  return RenderMarkdown(input);
}
</script>

<style>
.v-skeleton-loader__bone.v-skeleton-loader__heading {
  margin-left: 0px !important;
}
.v-skeleton-loader__bone.v-skeleton-loader__text {
  margin-left: 0px !important;
}
</style>
