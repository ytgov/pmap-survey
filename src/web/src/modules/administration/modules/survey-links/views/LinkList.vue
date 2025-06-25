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

  <h1>Survey Links</h1>

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
    <template v-slot:right>
      <add-link />
    </template>

    <v-data-table :search="search" :headers="headers" :items="items" :loading="isLoading" @click:row="rowClick" />

    <show-link />
  </base-card>
</template>
<script lang="ts">
import { mapActions, mapState } from "pinia";
import { useLinksAdminStore } from "../store";
import { clone } from "lodash";
import { useAdminSurveyStore } from "../../survey/store";
import AddLink from "../components/AddLink.vue";
import ShowLink from "../components/ShowLink.vue";

export default {
  components: { AddLink, ShowLink },
  data: () => ({
    headers: [
      { title: "Survey", key: "survey.NAME" },
      { title: "Demographic Group", key: "group.NAME" },
      { title: "Token", key: "SL_TOKEN" },
    ],
    search: "",
  }),
  computed: {
    ...mapState(useLinksAdminStore, ["links", "isLoading"]),
    items() {
      return this.links;
    },
    totalItems() {
      return this.links.length;
    },
    breadcrumbs() {
      return [
        {
          title: "Administration",
          to: "/administration",
        },
        {
          title: "Survey Links",
        },
      ];
    },
  },
  beforeMount() {
    this.loadItems();
    this.loadSurveys();
  },
  methods: {
    ...mapActions(useLinksAdminStore, ["loadLinks", "selectLink"]),
    ...mapActions(useAdminSurveyStore, ["loadSurveys"]),

    async loadItems() {
      await this.loadLinks();
    },
    rowClick(event: MouseEvent, thing: any) {
      this.selectLink(clone(thing.item));
    },
  },
};
</script>
