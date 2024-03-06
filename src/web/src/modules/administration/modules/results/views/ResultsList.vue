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

  <h1>Results</h1>

  <base-card showHeader="t" heading="" elevation="0">
    <template v-slot:left>
      <v-text-field
        v-model="search"
        label="Search"
        single-line
        hide-details
        append-inner-icon="mdi-magnify"
        density="compact"
        class="ml-2"></v-text-field>
    </template>

    <v-data-table :search="search" :headers="headers" :items="results" :loading="isLoading" @click:row="rowClick">
    </v-data-table>
  </base-card>
</template>
<script lang="ts">
import { mapActions, mapState } from "pinia";
import { useAdminResultsStore } from "../store";
import { clone } from "lodash";
import { useUserStore } from "@/store/UserStore";

export default {
  data: () => ({
    headers: [
      { title: "SID", key: "SID" },
      { title: "Name", key: "NAME" },
      { title: "Questions", key: "questions.length" },
    ],
    search: "",
  }),
  computed: {
    ...mapState(useAdminResultsStore, ["results", "isLoading"]),
    ...mapState(useUserStore, ["user"]),
    breadcrumbs() {
      return [
        {
          title: "Administration",
          to: "/administration",
        },
        {
          title: "Results",
        },
      ];
    },
  },
  async mounted() {
    await this.loadResults();
  },
  methods: {
    ...mapActions(useAdminResultsStore, ["loadResults", "select"]),

    rowClick(event: Event, { item }: { item: any }) {
      this.select(item.SID);
      this.$router.push(`/administration/results/${item.SID}`);
    },
  },
};
</script>
