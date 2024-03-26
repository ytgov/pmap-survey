<template>
  <v-breadcrumbs
    :items="breadcrumbs"
    bg-color="#7A9A01"
    style="margin: -13px -16px 10px -16px"
    class="pl-4 mb-4"
    color="white"
    active-color="#fff">
    <template v-slot:prepend>
      <v-icon color="white" icon="mdi-home"></v-icon>
    </template>
    <template v-slot:divider>
      <v-icon color="white" icon="mdi-chevron-right"></v-icon>
    </template>
  </v-breadcrumbs>

  <h1 v-if="result">{{ result.NAME }}</h1>

  <base-card showHeader="" heading="" elevation="0" v-if="result">
    <v-row class="mb-1">
      <v-col cols="12" md="3">
        <v-card elevation="3" color="#F2760C66" to="/administration/users">
          <v-card-text style="text-align: right">
            <v-icon
              class="float-left"
              style="font-size: 90px; opacity: 25%; position: absolute; left: 10px; margin-top: -12px"
              >mdi-account-multiple</v-icon
            >
            <div style="font-size: 52px; line-height: 52px">{{ result.stats.tokenCount }}</div>
            <div>Participants</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col>
        <v-card elevation="3" color="#F2760C66" to="/administration/users">
          <v-card-text style="text-align: right">
            <v-icon
              class="float-left"
              style="font-size: 90px; opacity: 25%; position: absolute; left: 10px; margin-top: -12px"
              >mdi-account-multiple</v-icon
            >
            <div style="font-size: 52px; line-height: 52px">{{ responseRate }}</div>
            <div>Response Rate ({{ result.stats.responseCount }})</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col>
        <v-card elevation="3" color="#F2760C66" to="/administration/users">
          <v-card-text style="text-align: right">
            <v-icon
              class="float-left"
              style="font-size: 90px; opacity: 25%; position: absolute; left: 10px; margin-top: -12px"
              >mdi-email</v-icon
            >
            <div style="font-size: 52px; line-height: 52px">{{ result.stats.sentCount }}</div>
            <div>First Emails</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col>
        <v-card elevation="3" color="#F2760C66" to="/administration/users">
          <v-card-text style="text-align: right">
            <v-icon
              class="float-left"
              style="font-size: 90px; opacity: 25%; position: absolute; left: 10px; margin-top: -12px"
              >mdi-email</v-icon
            >
            <div style="font-size: 52px; line-height: 52px">{{ result.stats.resentCount }}</div>
            <div>Reminder Emails</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <div v-for="question of result.questions">
      <v-card class="default mb-4">
        <v-card-text>
          <h3>{{ question.ASK }}</h3>
          <div class="d-flex">
            <v-chip color="info" class="mr-3" variant="flat" size="small">{{ question.TYPE }}</v-chip>
            <v-chip color="success" class="mr-3" variant="flat" size="small">{{
              question.OPTIONAL == 1 ? "Optional" : "Required"
            }}</v-chip>

            <div style="font-size: 22px; line-height: 28px; font-weight: 300">
              {{ question.responseCount }} Responses
            </div>
          </div>

          <div v-if="question.conditions.length > 0" class="mt-2 text-warning">
            Conditional based on: {{ question.conditionText }}
          </div>
        </v-card-text>
      </v-card>
    </div>
  </base-card>
</template>
<script lang="ts">
import { mapActions, mapState } from "pinia";
import { useAdminResultsStore } from "../store";
import { clone, isArray } from "lodash";
import { useUserStore } from "@/store/UserStore";

export default {
  data: () => ({}),
  computed: {
    ...mapState(useAdminResultsStore, ["result", "isLoading"]),
    ...mapState(useUserStore, ["user"]),
    breadcrumbs() {
      return [
        {
          title: "Administration",
          to: "/administration",
        },
        {
          title: "Results",
          to: "/administration/results",
        },
        {
          title: "Survey Details",
        },
      ];
    },
    responseRate() {
      if (this.result) {
        let num = this.result.stats.responseCount;
        let den = this.result.stats.tokenCount;
        if (num < 1 || den < 1) return "0%";
        return `${Math.round((num / den) * 100)}%`;
      }
      return "0%";
    },
  },
  async mounted() {
    if (!this.result) {
      await this.loadResults();
      let SID = this.$route.params.SID;
      this.select(parseInt(isArray(SID) ? SID[0] : SID));
    }
  },
  methods: {
    ...mapActions(useAdminResultsStore, ["loadResults", "select"]),

    rowClick(event: Event, { item }: { item: any }) {
      this.select(clone(item));
      this.$router.push(`/administration/results/${item.SID}`);
    },
  },
};
</script>
