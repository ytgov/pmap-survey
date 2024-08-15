<template>
  <div>
    <v-label style="text-overflow: inherit; overflow: visible; white-space: inherit"
      >Select items on the left to move them to the ranked list on the right. To remove items from the ranking, click
      them.</v-label
    >
    <v-row class="mt-3">
      <v-col>
        <h3>Available options:</h3>
        <div>
          <div
            v-for="option of availableOptions"
            @click="addChoiceClick(option)"
            class="rankingOption"
            style="cursor: pointer">
            {{ option.descr }}
          </div>
        </div>
      </v-col>
      <v-col>
        <h3>
          Ranked options:
          <small v-if="question.SELECT_LIMIT">Please choose your top {{ question.SELECT_LIMIT }}, drag to reorder</small
          >:
        </h3>

        <VueDraggableNext
          :list="selectedOptions"
          class="dragArea list-group w-full"
          itemKey="val"
          handle=".handle"
          @change="setAnswer">
          <div
            class="rankingOption d-flex"
            v-for="(option, idx) in selectedOptions"
            :key="option.val"
            @click="removeChoiceClick(option, idx)">
            <div class="handle mr-3"><v-icon>mdi-reorder-horizontal</v-icon></div>
            {{ option.descr }}
          </div>
        </VueDraggableNext>

        <!-- <div>
          <div v-for="(item, index) of selectedOptions" @click="removeChoiceClick(item)" class="rankingOption">
            {{ index + 1 }}. {{ item.descr }}
          </div>
        </div> -->
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { difference } from "lodash";
import { onMounted, ref } from "vue";
import { VueDraggableNext } from "vue-draggable-next";

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

function addChoiceClick(item) {
  if (props.question.SELECT_LIMIT) {
    const limit = parseInt(props.question.SELECT_LIMIT);
    if (selectedOptions.value.length >= limit) {
      return;
    }
  }

  selectedOptions.value.push(item);
  availableOptions.value = difference(allOptions.value, selectedOptions.value);

  setAnswer();
}

function removeChoiceClick(item, index) {
  selectedOptions.value.splice(index, 1);
  availableOptions.value = difference(allOptions.value, selectedOptions.value);
  setAnswer();
}

function setAnswer() {
  const newAnswer = selectedOptions.value.map((o) => `${o.val}`).join(",");
  props.question.answer = newAnswer;
  emit("answerChanged", newAnswer);
}
</script>

<style>
.list-group {
  /* background-color: red; */
  min-height: 100px;
}
.handle {
  cursor: move;
}
</style>
