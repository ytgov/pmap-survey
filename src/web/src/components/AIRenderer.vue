<template>
  <div>
    <v-label style="text-overflow: inherit; overflow: visible; white-space: inherit"
      >{{ question.ASK }}</v-label
    >
    <v-row class="mt-3">
      <v-col>AI ANSWER THREAD GO HERE</v-col>
    </v-row>
  </div>
</template>

<script setup>
import { difference } from "lodash";
import { onMounted, ref } from "vue";

const props = defineProps(["question"]);
const emit = defineEmits(["answerChanged"]);

const allOptions = ref([]);
const availableOptions = ref([]);
const selectedOptions = ref([]);

onMounted(() => {
  allOptions.value = props.question.choices;

  setTimeout(() => {
    if (props.question && props.question.answer) {
      let answers = (props.question.answer ?? "").split(",");

      availableOptions.value = allOptions.value.filter((o) => !answers.includes(`${o.val}`));
      selectedOptions.value = allOptions.value.filter((o) => answers.includes(`${o.val}`));
    } else {
      availableOptions.value = allOptions.value;
    }
  }, 25);
});

function setAnswer() {
  const newAnswer = selectedOptions.value.map((o) => `${o.val}`).join(",");
  props.question.answer = newAnswer;
  emit("answerChanged", newAnswer);
}
</script>
