<template>
  <div>
    <v-card class="default mb-5">
      <v-card-title>
        <v-row>
          <v-col cols="10"> Question {{ index + 1 }}: {{question.ASK}}</v-col>
          <v-col cols="2"
            ><div class="float-right">
              <v-icon
                color="red"
                class="float-right"
                style="width: 40px"
                title="Question incomplete"
                v-if="!isValid && question.OPTIONAL == 0"
                >mdi-alert-octagon</v-icon
              >
              <v-icon
                color="green"
                class="float-right"
                style="width: 40px"
                title="Question complete"
                v-if="isValid && question.OPTIONAL == 0"
                >mdi-check-bold</v-icon
              >
            </div></v-col
          >
        </v-row>
      </v-card-title>
      <v-card-text>
        <span>{{ hint }}</span>
        <div v-if="question.TYPE == 'boolean'">
          <v-select
            v-model="answer"
            :items="['Yes', 'No']"
            dense
            outlined
            hide-details
            background-color="white"
          ></v-select>
        </div>
        <div v-if="question.TYPE == 'range'">
          <v-select
            v-model="answer"
            :items="options"
            :item-text="'descr'"
            :item-value="'val'"
            dense
            outlined
            hide-details
            background-color="white"
          ></v-select>
        </div>

        <div v-if="question.TYPE == 'multi-select'">
          <v-select
            v-model="answer"
            :items="options"
            :item-text="'descr'"
            :item-value="'val'"
            dense
            outlined
            hide-details
            multiple
            background-color="white"
          ></v-select>
        </div>

        <div v-if="question.TYPE == 'select'">
          <v-select
            v-model="answer"
            :items="options"
            :item-text="'descr'"
            :item-value="'val'"
            dense
            outlined
            hide-details
            background-color="white"
          ></v-select>
        </div>

        <div v-if="question.TYPE == 'free-text'">
          <v-textarea
            :label="question.ASK"
            dense
            outlined
            hide-details
            background-color="white"
          ></v-textarea>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  name: "Home",
  props: ["index", "question"],
  computed: {
    options: function () {
      if (
        this.question.TYPE == "multi-select" ||
        this.question.TYPE == "select" ||
        this.question.TYPE == "range"
      ) {
        let optsS = this.question.SELECTION_JSON;
        let opts = JSON.parse(optsS);

        return opts.choices;
      }
      return [];
    },
    hint: function () {
      let hint = "";
      if (this.question.OPTIONAL == 0) {
        hint = "* Required";
      } else {
        hint = "* Optional";
      }

      if (this.question.TYPE == "multi-select")
        hint += ", you may select as many as you see fit";

      return hint;
    },
    isValid: function () {
      if (this.question.OPTIONAL == 1) return true;
      let trimAnswer = `${this.answer}`.replace('null','').trim()
      if (trimAnswer && trimAnswer.length > 0) return true;
      return false;
    },
  },
  data: () => ({
    answer: null,
  }),
  methods: {},
};
</script>
