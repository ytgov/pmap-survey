<template>
  <div style="font-size: 0.75rem">
    <div class="quadrant mt-4" v-if="xAxis && yAxis" :style="blockStyle">
      <div class="" :style="`height: ${blockHeight}; float: left; width: 25px`">
        <div
          class="text-center"
          :style="`position: relative;
            height: 25px;
            width: ${blockHeight};
            padding: 5px 0px;
            top: ${blockHeight};
            rotate: 270deg;
            transform-origin: 00px 00px;`">
          {{ yAxis.ASK }}
        </div>
      </div>

      <div v-for="(yc, yidx) of yOptions">
        <div class="block side rotate">{{ yc.descr }}</div>

        <div
          v-for="(xc, xidx) of xOptions"
          class="block"
          :class="{
            bottom: yidx == yOptions.length - 1,
            right: xidx == xOptions.length - 1,
            active: selectedValue == `${xc.val},${yc.val}`,
          }"
          @click="setAnswer([xc.val, yc.val])">
          <v-icon class="mt-5" size="x-large" color="red">mdi-circle</v-icon>
        </div>
      </div>
      <div class="block side" style="width: 25px"></div>
      <div class="block side" style="width: 62px">
        <v-icon color="black" style="display: block">mdi-arrow-top-right-thin</v-icon>
      </div>
      <div v-for="xc of xOptions" class="block side">{{ xc.descr }}</div>
      <div class="block side wide" :style="`width: ${blockWidth};padding-top:0 !important`">{{ xAxis.ASK }}</div>
    </div>
  </div>
</template>

<script>
import { cloneDeep, reverse } from "lodash";

export default {
  props: ["question", "subUpdated"],
  data: () => ({}),
  computed: {
    xAxis() {
      let xQuestion = this.question.subQuestions[0];
      if (xQuestion) return xQuestion;
      return undefined;
    },
    yAxis() {
      let yQuestion = this.question.subQuestions[1];
      if (yQuestion) return yQuestion;
      return undefined;
    },
    yOptions() {
      if (this.yAxis) {
        let c = cloneDeep(this.yAxis.choices);
        return reverse(c);
      }
      return [];
    },
    xOptions() {
      if (this.xAxis) {
        return this.xAxis.choices;
      }
      return [];
    },
    blockStyle() {
      if (this.xAxis && this.yAxis) {
        let height = (this.yOptions.length + 2) * 65 + 1;
        let width = (this.xAxis.choices.length + 1) * 65 + 25;
        return `width: ${width}px; height: ${height}px;`;
      }

      return "";
    },
    blockWidth() {
      return `${(this.xAxis.choices.length + 1) * 65 + 25}px`;
    },
    blockHeight() {
      return `${this.yAxis.choices.length * 65}px`;
    },
    selectedValue() {
      if (this.xAxis && this.yAxis) {
        return `${this.xAxis.answer},${this.yAxis.answer}`;
      }

      return undefined;
    },
  },

  methods: {
    setAnswer(value) {
      if (this.xAxis && this.yAxis) {
        this.xAxis.answer = value[0];
        this.yAxis.answer = value[1];

        this.subUpdated(this.xAxis);
        this.subUpdated(this.yAxis);
      }

      //this.question.answer = value;
      this.$emit("answerChanged", this.question.answer);
    },
  },
};
</script>

<style>
.quadrant .block {
  float: left;
  height: 65px;
  width: 65px;
}
.quadrant .block.side {
  text-align: center;
  padding: 14px;
}
.quadrant .wide {
  text-align: center !important;
  padding-left: 90px !important;
}
.rotate {
  rotate: 270deg;
}
.quadrant .block.bottom {
  border-bottom: 1px #999 solid;
}
.quadrant .block.right {
  border-right: 1px #999 solid;
}
.quadrant .block:not(.side) {
  border-top: 1px #999 solid;
  border-left: 1px #999 solid;
  background-color: white;
  padding: auto;
  text-align: center;
  cursor: pointer;
}

.quadrant div i {
  display: none;
}
.quadrant div.active i {
  display: inline-flex;
}
</style>
