import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";
import { SURVEY_URL } from "../urls";

Vue.use(Vuex);

export default new Vuex.Store({
  getters: {
    survey: state => state.survey,
  },
  state: {
    survey: { survey: {}, questions: [] },
  },
  mutations: {
    SET_SURVEY(state, value) {
      state.survey = value;
    },
  },
  actions: {

    loadSurvey({ commit }, id) {
      axios.get(`${SURVEY_URL}/${id}`)
        .then(resp => { commit("SET_SURVEY", resp.data.data) });
    },
  },
});
