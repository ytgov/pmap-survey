import { defineStore } from "pinia";
import axios from "axios";
import { apiBaseUrl } from "@/config";

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
}

export interface ChatMessage extends OllamaMessage {
  timestamp: Date;
}

interface AIState {
  messages: ChatMessage[];
  models: OllamaModel[];
  selectedModel: string;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

const API_BASE = apiBaseUrl + "/api/ai";

export const useAIAssistantStore = defineStore("ai-assistant", {
  state: (): AIState => ({
    messages: [],
    models: [],
    selectedModel: "",
    isConnected: false,
    isLoading: false,
    error: null,
  }),

  getters: {
    hasMessages: (state) => state.messages.length > 0,
    connectionStatus: (state) => (state.isConnected ? "Connected" : "Disconnected"),
  },

  actions: {
    async checkConnection() {
      try {
        this.isLoading = true;
        this.error = null;
        const response = await axios.get(`${API_BASE}`);
        this.isConnected = response.data.data.connected;
        this.models = response.data.data.models || [];

        if (this.models.length > 0 && !this.selectedModel) {
          this.selectedModel = this.models[0].name;
        }

        return response.data.data;
      } catch (error: any) {
        this.isConnected = false;
        this.error = error.response?.data?.error || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async loadModels() {
      try {
        this.isLoading = true;
        this.error = null;
        const response = await axios.get(`${API_BASE}/models`);
        this.models = response.data.data || [];

        if (this.models.length > 0 && !this.selectedModel) {
          this.selectedModel = this.models[0].name;
        }
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async sendMessage(content: string) {
      try {
        this.isLoading = true;
        this.error = null;

        // Add user message to chat
        const userMessage: ChatMessage = {
          role: "user",
          content,
          timestamp: new Date(),
        };
        this.messages.push(userMessage);

        // Prepare messages for API (without timestamp)
        const apiMessages = this.messages.map(({ role, content }) => ({ role, content }));

        // Send to API
        const response = await axios.post(`${API_BASE}/chat`, {
          messages: apiMessages,
          model: this.selectedModel,
        });

        // Add assistant response
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: response.data.data.message.content,
          timestamp: new Date(),
        };
        this.messages.push(assistantMessage);

        return assistantMessage;
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message;
        // Remove the user message if there was an error
        this.messages.pop();
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async generateCompletion(prompt: string) {
      try {
        this.isLoading = true;
        this.error = null;

        const response = await axios.post(`${API_BASE}/generate`, {
          prompt,
          model: this.selectedModel,
        });

        return response.data.data.response;
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    clearMessages() {
      this.messages = [];
    },

    setModel(modelName: string) {
      this.selectedModel = modelName;
    },

    async pullModel(modelName: string) {
      try {
        this.isLoading = true;
        this.error = null;
        const response = await axios.post(`${API_BASE}/models/pull`, {
          modelName,
        });
        await this.loadModels();
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteModel(modelName: string) {
      try {
        this.isLoading = true;
        this.error = null;
        await axios.delete(`${API_BASE}/models/${modelName}`);
        await this.loadModels();
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
