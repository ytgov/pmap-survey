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

  <h1>Demographic Groups</h1>

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
      <add-group :onComplete="openItem"></add-group>
    </template>

    <v-data-table :search="search" :headers="headers" :items="items" :loading="isLoading" @click:row="rowClick">
    </v-data-table>
  </base-card>

  <group-editor></group-editor>
</template>
<script lang="ts">
import { mapActions, mapState } from "pinia";
import { useDemographicAdminStore } from "../store";
import GroupEditor from "../components/GroupEditor.vue";
import { clone } from "lodash";
import AddGroup from "../components/AddGroup.vue";
import { useAdminSurveyStore } from "../../survey/store";

export default {
  components: { GroupEditor, AddGroup },
  data: () => ({
    headers: [
      { title: "Name", key: "NAME" },
      { title: "Survey", key: "survey.NAME" },
      { title: "Values", key: "values.length" },
    ],
    search: "",
  }),
  computed: {
    ...mapState(useDemographicAdminStore, ["groups", "isLoading"]),
    items() {
      return this.groups;
    },
    totalItems() {
      return this.groups.length;
    },
    breadcrumbs() {
      return [
        {
          title: "Administration",
          to: "/administration",
        },
        {
          title: "Demographic Groups",
        },
      ];
    },
  },
  beforeMount() {
    this.loadItems();
    this.loadSurveys();
  },
  methods: {
    ...mapActions(useDemographicAdminStore, ["getAllGroups", "selectGroup"]),
    ...mapActions(useAdminSurveyStore, ["loadSurveys"]),

    async loadItems() {
      await this.getAllGroups();
    },
    rowClick(event: Event, thing: any) {
      this.selectGroup(clone(thing.item));
    },
    openItem(item: any) {
      this.selectGroup(clone(item));
    },
  },
};
</script>
