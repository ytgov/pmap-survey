import { defineStore } from "pinia";
import { useApiStore } from "@/store/ApiStore";
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
  defaultModel: string;
  isConnected: boolean;
  isLoading: boolean;
  isSavingDefault: boolean;
  error: string | null;
}

const API_BASE = apiBaseUrl + "/api/ai";
const SETTINGS_API = apiBaseUrl + "/api/admin/setting";

export const useAIAssistantStore = defineStore("ai-assistant", {
  state: (): AIState => ({
    messages: [],
    models: [],
    selectedModel: "",
    defaultModel: "",
    isConnected: false,
    isLoading: false,
    isSavingDefault: false,
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
        const api = useApiStore();
        const response = await api.secureCall("get", `${API_BASE}`);
        if (response.error) throw response.error;
        this.isConnected = response.data.connected;
        this.models = response.data.models || [];

        if (this.models.length > 0 && !this.selectedModel) {
          this.selectedModel = this.models[0].name;
        }

        return response.data;
      } catch (error: any) {
        this.isConnected = false;
        this.error = error.response?.data?.error || error.message || String(error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async loadModels() {
      try {
        this.isLoading = true;
        this.error = null;
        const api = useApiStore();
        const response = await api.secureCall("get", `${API_BASE}/models`);
        if (response.error) throw response.error;
        this.models = response.data || [];

        if (this.models.length > 0 && !this.selectedModel) {
          this.selectedModel = this.models[0].name;
        }
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message || String(error);
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
        const api = useApiStore();
        const response = await api.secureCall("post", `${API_BASE}/chat`, {
          messages: apiMessages,
          model: this.selectedModel,
        });
        if (response.error) throw response.error;

        // Add assistant response
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: response.data.message.content,
          timestamp: new Date(),
        };
        this.messages.push(assistantMessage);

        return assistantMessage;
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message || String(error);
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

        const api = useApiStore();
        const response = await api.secureCall("post", `${API_BASE}/generate`, {
          prompt,
          model: this.selectedModel,
        });
        if (response.error) throw response.error;

        return response.data.response;
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message || String(error);
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
        const api = useApiStore();
        const response = await api.secureCall("post", `${API_BASE}/models/pull`, {
          modelName,
        });
        if (response.error) throw response.error;
        await this.loadModels();
        return response;
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message || String(error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteModel(modelName: string) {
      try {
        this.isLoading = true;
        this.error = null;
        const api = useApiStore();
        const response = await api.secureCall("delete", `${API_BASE}/models/${modelName}`);
        if (response.error) throw response.error;
        await this.loadModels();
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message || String(error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async loadDefaultModel() {
      try {
        const api = useApiStore();
        const response = await api.secureCall("get", `${SETTINGS_API}/key/DEFAULT_MODEL`);
        if (response.data?.VALUE) {
          this.defaultModel = response.data.VALUE;
        }
      } catch (error: any) {
        console.error("Failed to load default model setting:", error);
      }
    },

    async saveDefaultModel(modelName: string) {
      try {
        this.isSavingDefault = true;
        this.error = null;
        const api = useApiStore();
        const response = await api.secureCall("put", `${SETTINGS_API}/key/DEFAULT_MODEL`, { VALUE: modelName });
        if (response.error) throw response.error;
        this.defaultModel = modelName;
      } catch (error: any) {
        this.error = error.response?.data?.error || error.message || String(error);
        throw error;
      } finally {
        this.isSavingDefault = false;
      }
    },
  },
});
