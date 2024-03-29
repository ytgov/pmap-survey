<template>
  <div>
    <v-card class="default mb-5 question">
      <v-card-text style="clear: both">
        <v-row>
          <v-col cols="11" class="pb-1 text-heading2" style="line-height: 24px">
            <div
              v-if="question.TYPE == 'text' && renderMarkdown(question.ASK).isMarkdown"
              v-html="renderMarkdown(question.ASK).output"
              class="pb-2 markdown"></div>
            <div v-else-if="question.TYPE == 'text'" class="pb-2">
              <h3>{{ question.ASK }}</h3>
            </div>
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
            hide-selected
            hide-details
            multiple
            small-chips
            deletable-chips
            @update:model-value="limiter"
            v-model="question.answer"
            :items="options"
            :item-title="'descr'"
            :item-value="'val'"></v-autocomplete>
        </div>

        <div v-else-if="question.TYPE == 'select'">
          <v-select
            v-model="question.answer"
            :items="options"
            :item-title="'descr'"
            :item-value="'val'"
            hide-details
            class="mt-4"
            v-if="options.length >= 7"></v-select>

          <v-radio-group v-model="question.answer" hide-details v-if="options.length < 7">
            <v-radio
              :label="item.descr"
              :value="`${item.val}`"
              v-for="item of options"
              :key="item.val"
              class="pt-1"></v-radio>
          </v-radio-group>

          <div v-if="allowCustomText" class="mt-4 pl-5">
            <p class="mb-2">{{ customTextAsk }}</p>
            <v-text-field v-model="question.answer_text" hide-details></v-text-field>
          </div>
        </div>

        <div v-else-if="question.TYPE == 'free-text'">
          <v-textarea v-model="question.answer" hide-details class="mt-4"></v-textarea>
        </div>

        <div v-else-if="question.TYPE == 'title_question'">
          <table class="matrix" v-if="question.subQuestions.length > 0 && question.subQuestions[0].choices">
            <tr>
              <td></td>
              <th v-for="ch of question.subQuestions[0].choices">{{ ch.descr }}</th>
            </tr>

            <tr v-for="sub of question.subQuestions">
              <th style="text-align: left" v-if="sub.isVisible">
                {{ sub.ASK }}
              </th>
              <td v-for="ch of sub.choices" v-if="sub.isVisible">
                <v-checkbox
                  class="my-0 mx-auto"
                  v-model="sub.answer"
                  hide-details
                  :value="ch.val"
                  density="compact"
                  @update:model-value="subUpdated(sub)"
                  style="width: 30px" />
              </td>
            </tr>
          </table>
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

<script>
import { RenderMarkdown } from "@/utils";
import { isArray } from "lodash";
import { nextTick } from "vue";

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
    storageID() {
      return `${this.question.QID}_ANSWER`;
    },
  },
  mounted() {
    let val = localStorage.getItem(this.storageID);
    let value = JSON.parse(val);
    let q = this.question;

    if (q.subQuestions) {
      for (let sq of q.subQuestions) {
        let subStorage = `${sq.QID}_ANSWER`;
        let sqVal = localStorage.getItem(subStorage);
        let sqValue = JSON.parse(sqVal);

        if (sqValue) sq.answer = sqValue.value;
      }
    }

    nextTick(() => {
      if (value) q.answer = value.value;
    });
  },
  watch: {
    "question.answer": function (nval) {
      localStorage.setItem(this.storageID, JSON.stringify({ value: nval }));
      this.$emit("answerChanged", nval);
    },
  },
  data: () => ({}),
  methods: {
    subUpdated(subQ) {
      localStorage.setItem(`${subQ.QID}_ANSWER`, JSON.stringify({ value: subQ.answer }));
      this.$emit("answerChanged", subQ.answer);
    },

    checkCustom() {
      if (this.selectedOption && this.selectedOption.allow_custom && this.selectedOption.allow_custom == "true") {
        this.showCustomField = true;
      } else {
        this.showCustomField = false;
        this.question.answer_text = "";
      }
    },
    renderMarkdown(input) {
      return RenderMarkdown(input);
    },

    limiter(e) {
      if (this.question.SELECT_LIMIT) {
        if (isArray(e)) {
          if (e.length > this.question.SELECT_LIMIT) {
            e.pop();
          }
        }
      }
    },
  },
};
</script>

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
