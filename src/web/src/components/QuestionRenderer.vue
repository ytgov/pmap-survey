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
                v-if="question.showCheck() && question.OPTIONAL == 0"
                >mdi-check-bold</v-icon
              >
              <span class="d-none"
                >{{ question.answer }}
                <span v-if="question.subQuestions" v-for="q of question.subQuestions">{{ q.answer }}</span></span
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
            v-if="question.RENDER_AS == 'Radio'"
            class="mt-4"
            clearable
            hide-details
            multiple
            @update:model-value="limiter"
            v-model="question.answer"
            :items="options"
            :item-title="'descr'"
            :item-value="'val'"></v-autocomplete>
          <v-autocomplete
            v-else
            class="mt-4"
            clearable
            hide-selected
            hide-details
            chips
            multiple
            small-chips
            closable-chips
            @update:model-value="limiter"
            v-model="question.answer"
            :items="options"
            :item-title="'descr'"
            :item-value="'val'"></v-autocomplete>
        </div>

        <div v-else-if="question.TYPE == 'select'">
          <v-select
            v-if="question.RENDER_AS == 'Select' || (!question.RENDER_AS && options.length >= 7)"
            v-model="question.answer"
            :items="options"
            :item-title="'descr'"
            :item-value="'val'"
            hide-details
            class="mt-4"></v-select>

          <v-radio-group v-model="question.answer" hide-details v-else>
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
          <v-textarea
            v-model="question.answer"
            class="mt-4"
            :counter="question.MAX_LENGTH ?? 256"
            :maxlength="question.MAX_LENGTH ?? 256"
            persistent-counter></v-textarea>
        </div>

        <div v-else-if="question.TYPE == 'title_question'">
          <table class="matrix" v-if="question.subQuestions.length > 0 && question.subQuestions[0].choices">
            <tr>
              <td style="width: 50%; border-right: 1px #32323233 solid"></td>
              <th
                v-for="ch of question.subQuestions[0].choices"
                :style="'width:' + 50 / question.subQuestions[0].choices.length + '%'">
                {{ ch.descr }}
              </th>
            </tr>

            <tr v-for="sub of question.subQuestions">
              <th style="text-align: left; width: 50%; border-right: 1px #32323233 solid" v-if="sub.isVisible">
                {{ sub.ASK }}
              </th>
              <td v-for="ch of sub.choices" v-if="sub.isVisible" :style="'width:' + 50 / sub.choices.length + '%'">
                <v-radio-group v-model="sub.answer" hide-details class="mb-3" @update:model-value="subUpdated(sub)">
                  <v-radio class="my-0 mx-auto" hide-details :value="ch.val" density="compact" style="width: 30px" />
                </v-radio-group>
              </td>
            </tr>
          </table>
        </div>

        <div v-else-if="question.TYPE == 'ranking'">
          <RankingRenderer :question="question" />
        </div>

        <div v-else-if="question.TYPE == 'quadrant_title'">
          <QuadrantRenderer :question="question" :subUpdated="subUpdated"></QuadrantRenderer>
        </div>
        <div v-else-if="question.TYPE == 'number'">
          <v-text-field
            v-model="question.answer"
            type="number"
            class="mt-4"
            @update:focused="cleanNumber"
            @keydown="keydown" />
        </div>
        <div v-else-if="question.TYPE == 'date'">
          <DateRenderer v-model="question.answer" />
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
import { isArray, isNil, isNull } from "lodash";
import { nextTick } from "vue";
import { RenderMarkdown } from "@/utils";
import RankingRenderer from "./RankingRenderer.vue";
import QuadrantRenderer from "./QuadrantRenderer.vue";
import DateRenderer from "./DateRenderer.vue";

export default {
  name: "Home",
  components: { QuadrantRenderer, RankingRenderer },
  props: ["index", "question"],
  data: () => ({}),
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
  created() {
    let val = localStorage.getItem(this.storageID);
    let value = JSON.parse(val);
    let q = this.question;

    if (q.subQuestions) {
      for (let sq of q.subQuestions) {
        let subStorage = `${sq.QID}_ANSWER`;
        let sqVal = localStorage.getItem(subStorage);
        let sqValue = JSON.parse(sqVal);

        if (sqValue && sqValue.value) sq.answer = sqValue.value;
      }
    }

    nextTick(() => {
      if (value && value.value) q.answer = value.value;
    });
  },
  watch: {
    "question.answer": function (nval, oval) {
      if (!isNull(nval) && nval != "") {
        localStorage.setItem(this.storageID, JSON.stringify({ value: nval }));
      } else {
        localStorage.removeItem(this.storageID);
      }

      this.$emit("answerChanged", nval);
    },
  },
  methods: {
    subUpdated(subQ) {
      if (!isNull(subQ.answer) && subQ.answer != "") {
        localStorage.setItem(`${subQ.QID}_ANSWER`, JSON.stringify({ value: subQ.answer }));
      } else {
        localStorage.removeItem(`${subQ.QID}_ANSWER`);
      }

      this.$emit("answerChanged", subQ.answer);
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

    // this function is the keydown and excludes any key thats not a number
    // backspace, delete, and arrow keys are allowed
    keydown(e) {
      if (e.keyCode === 69 || e.keyCode === 189 || e.keyCode === 190) {
        e.preventDefault();
      }
      if (e.keyCode === 8 || e.keyCode === 46 || e.keyCode === 37 || e.keyCode === 39) {
        return; // Allow backspace, delete, left arrow, right arrow
      }
      if (e.keyCode < 48 || e.keyCode > 57) {
        if (e.keyCode < 96 || e.keyCode > 105) {
          e.preventDefault();
        }
      }
    },

    cleanNumber(e) {
      if (e) return;

      let value = `${this.question.answer ?? ""}`.replace(/[e]/g, "");
      console.log("cleanNumber", this.question.answer, typeof value);

      if (isNull(value) || value === "") {
        console.log("cleanNumber is null or empty, setting to null");
        value = null;
      } else {
        console.log("cleanNumber is string", value);

        // Remove non-numeric characters, but leave the first minus sign if it exists and decimal point
        let v = parseInt(value.replace(/[e]/g, "").replace(/[^0-9.-]+/g, ""));

        console.log("cleanNumber parsed", v);

        if (isNaN(v)) {
          console.log("cleanNumber is NaN, setting to null");
          value = null;
        } else {
          value = Math.max(0, v);
        }
      }

      const q = this.question;

      nextTick(() => {
        console.log("cleanNumber after", value);
        if (value === null || value === "") q.answer = null;
        else q.answer = `${value}`;
      });
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

.rankingOption {
  border: 1px #999 solid;
  border-radius: 4px;
  padding: 5px 10px;
  margin-bottom: 5px;
  background-color: white;
  cursor: pointer;
}
</style>
