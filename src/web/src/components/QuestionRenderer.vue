<template>
  <div>
    <v-card class="default mb-5 question">
      <v-card-text style="clear: both">
        <v-row>
          <v-col cols="11" class="pb-1 text-heading2" style="line-height: 24px">
            <div v-if="question.TYPE == 'text'" v-html="renderMarkdown(question.ASK)" class="pb-2"></div>
            <h3 v-else>
              Question {{ index + 1 }}: {{ question.ASK }}
              <span v-if="question.OPTIONAL == 0" class="text-error">*</span>
            </h3>
          </v-col>
          <v-col cols="1" class="py-1">
            <div class="float-right">
              <v-icon
                color="green"
                class="float-right"
                style="width: 40px"
                title="Question complete"
                v-if="question.isValid() && question.OPTIONAL == 0"
                >mdi-check-bold</v-icon
              >
            </div>
          </v-col>
        </v-row>
        <div v-if="question.TYPE == 'boolean'">
          <v-radio-group v-model="question.answer" hide-details>
            <v-radio label="Yes" value="Yes" class="pt-1"></v-radio>
            <v-radio label="No" value="No" class="pt-1"></v-radio>
          </v-radio-group>
        </div>
        <div v-else-if="question.TYPE == 'range'">
          <v-radio-group v-model="question.answer" hide-details>
            <v-radio
              :label="item.descr"
              :value="item.val"
              v-for="item of options"
              :key="item.val"
              class="pt-1"></v-radio>
          </v-radio-group>
        </div>

        <div v-else-if="question.TYPE == 'multi-select'">
          <v-autocomplete
            class="mt-4"
            clearable
            dense
            hide-selected
            hide-details
            multiple
            outlined
            small-chips
            deletable-chips
            v-model="question.answer"
            :items="options"
            :item-text="'descr'"
            :item-value="'val'"
            background-color="white"></v-autocomplete>
        </div>

        <div v-else-if="question.TYPE == 'select'">
          <v-select
            v-model="question.answer"
            :items="options"
            :item-text="'descr'"
            :item-value="'val'"
            dense
            outlined
            hide-details
            background-color="white"
            class="mt-4"
            v-if="options.length >= 7"></v-select>

          <v-radio-group v-model="question.answer" hide-details v-if="options.length < 7">
            <v-radio
              :label="item.descr"
              :value="item.val"
              v-for="item of options"
              :key="item.val"
              class="pt-1"></v-radio>
          </v-radio-group>

          <div v-if="allowCustomText" class="mt-4 pl-5">
            <p class="mb-2">{{ customTextAsk }}</p>
            <v-text-field
              v-model="question.answer_text"
              dense
              outlined
              hide-details
              background-color="white"></v-text-field>
          </div>
        </div>

        <div v-else-if="question.TYPE == 'free-text'">
          <v-textarea
            dense
            v-model="question.answer"
            outlined
            hide-details
            background-color="white"
            class="mt-4"></v-textarea>
        </div>

        <div v-else-if="question.TYPE == 'title_question'">
          <table class="matrix">
            <tr>
              <td></td>
              <th v-for="ch of question.subQuestions[1].choices">{{ ch.descr }}</th>
            </tr>

            <tr v-for="sub of question.subQuestions">
              <th style="text-align: left">
                {{ sub.ASK }}
              </th>
              <td v-for="ch of sub.choices">
                <v-checkbox
                  class="my-0 mx-auto"
                  v-model="sub.answer"
                  hide-details
                  :value="ch.val"
                  density="compact"
                  style="width: 30px" />
              </td>
            </tr>
          </table>

          <!-- {{ question.subQuestions }} -->
        </div>
        <div v-else-if="question.TYPE != 'text'">
          {{ question }}
        </div>
        <!--  <hr />
        {{ question }} -->
      </v-card-text>
    </v-card>
  </div>
</template>

<style>
.question .v-label {
  color: #323232 !important;
}
.question .v-radio {
  padding-top: 12px;
}
table.matrix {
  /* border-left: 1px #323232 solid;
  border-top: 1px #323232 solid; */
  width: 100%;
  border-collapse: collapse;
  /* background-color: #efefef; */
}
table.matrix td,
table.matrix th {
  /* border-right: 1px #323232 solid;*/
  border-bottom: 1px #32323233 solid;
  padding: 2px 4px;
  text-align: center;
  font-weight: 400;
  font-size: 0.95rem;
}
</style>

<script>
import markdownit from "markdown-it";

export default {
  name: "Home",
  props: ["index", "question"],
  computed: {
    options: function () {
      return this.question.choices || [];
    },
    hint: function () {
      let hint = "";
      if (this.question.OPTIONAL == 0) {
        hint = "*";
      } else {
        hint = "";
      }

      if (this.question.TYPE == "multi-select") hint += ", you may select as many as you see fit";

      return hint;
    },
    selectedOption: function () {
      return this.options.find((o) => o.val == this.question.answer);
    },
    allowCustomText: function () {
      if (this.selectedOption && this.selectedOption.allow_custom && this.selectedOption.allow_custom == "true") {
        return true;
      }
      return false;
    },
    customTextAsk: function () {
      if (this.allowCustomText) {
        return this.selectedOption.custom_ask;
      }
      return "";
    },
  },
  data: () => ({}),
  methods: {
    checkCustom() {
      if (this.selectedOption && this.selectedOption.allow_custom && this.selectedOption.allow_custom == "true") {
        this.showCustomField = true;
      } else {
        this.showCustomField = false;
        this.question.answer_text = "";
      }
    },
    renderMarkdown(input) {
      const md = markdownit();
      return md.render(input);
    },
  },
};
</script>
