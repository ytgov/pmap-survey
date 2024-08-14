<template>
  <div v-if="survey && survey.survey && survey.survey.CONTACT_QUESTION">
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
</template>
<script setup>
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";

import { useSurveyStore } from "@/store/SurveyStore";
const surveyStore = useSurveyStore();
const { survey } = storeToRefs(surveyStore);

const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);

const contactMe = ref(false);

watch(contactMe, (nv) => {
  emit("update:modelValue", nv);
});
</script>
