<template>
  <h4 class="mb-4">Once completed, please press 'Submit' at the bottom.</h4>
  <div class="row">
    <div class="col-sm-12 col-md-9 col-lg-7">
      <div v-for="(question, idx) of questionGroups" :key="idx">
        <question-renderer
          :index="question.questionIndex"
          :question="question"
          :allowStorage="survey.survey.NO_LOCAL_STORAGE == 0"
          @answerChanged="checkAllValid"
          :class="{ 'd-none': !question.isVisible }"></question-renderer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";

import { useSurveyStore } from "@/store/SurveyStore";
import { computed } from "vue";

const surveyStore = useSurveyStore();
const { survey } = storeToRefs(surveyStore);

const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);

const questionGroups = computed(() => {
  let list = [];

  if (survey.value.questions) {
    let lastTitle = null;
    let index = 0;

    for (let question of survey.value.questions) {
      if (question.TYPE == "title_question") {
        question.subQuestions = [];
        lastTitle = question;

        if (question.isVisible) {
          question.questionIndex = index;
          index++;
        }

        list.push(question);
      } else if (question.TYPE == "matrix_question") {
        if (lastTitle) lastTitle.subQuestions.push(question);
      } else if (question.TYPE == "quadrant_title") {
        question.subQuestions = [];
        lastTitle = question;

        if (question.isVisible) {
          question.questionIndex = index;
          index++;
        }

        list.push(question);
      } else if (question.TYPE == "quadrant") {
        if (lastTitle) lastTitle.subQuestions.push(question);
      } else if (question.TYPE == "text") {
        list.push(question);
      } else {
        if (question.isVisible) {
          question.questionIndex = index;
          index++;
        }

        list.push(question);
      }
    }
  }
  return list;
});

function checkAllValid() {
  let v = true;

  for (let q of survey.value.questions) {
    q.isVisible = q.checkConditions();

    if (!q.isVisible) {
      q.answer = null;
    }

    let qv = q.isValid();
    v = v && qv;
  }

  emit("update:modelValue", v);
}

checkAllValid();
</script>

<style scoped>
li {
  margin-bottom: 15px;
}
</style>
