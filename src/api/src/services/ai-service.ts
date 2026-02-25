import axios, { AxiosInstance } from "axios";
import { OLLAMA_BASE_URL, OLLAMA_DEFAULT_MODEL } from "../config";
import { SETTING_KEY, SettingService } from "./setting-service";

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
  images?: string[];
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  format?: "json";
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
  };
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  format?: "json";
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export class AIService {
  connected = false;
  private client: AxiosInstance;
  private baseUrl: string;
  private defaultModel: string;
  private settingService: SettingService;

  constructor() {
    this.baseUrl = OLLAMA_BASE_URL;
    this.defaultModel = OLLAMA_DEFAULT_MODEL;
    this.settingService = new SettingService();
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 120000, // 2 minutes timeout for longer responses
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Load the default model from the settings table
   */
  async loadDefaultModel(): Promise<string> {
    try {
      const setting = await this.settingService.getGlobalByKey(SETTING_KEY.DEFAULT_MODEL);
      if (setting?.VALUE) {
        this.defaultModel = setting.VALUE;
      }
    } catch (error: any) {
      console.error("Failed to load default model from settings:", error.message);
    }
    return this.defaultModel;
  }

  /**
   * Test connection to Ollama instance
   */
  async connect(): Promise<any> {
    try {
      await this.loadDefaultModel();

      const response = await this.client.get("/api/tags");
      this.connected = true;
      return {
        connected: true,
        models: response.data.models || [],
        baseUrl: this.baseUrl,
        defaultModel: this.defaultModel,
      };
    } catch (error: any) {
      this.connected = false;
      console.error("Failed to connect to Ollama:", error.message);
      throw new Error(`Failed to connect to Ollama at ${this.baseUrl}: ${error.message}`);
    }
  }

  /**
   * Get list of available models
   */
  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await this.client.get("/api/tags");
      return response.data.models || [];
    } catch (error: any) {
      console.error("Failed to list models:", error.message);
      throw new Error(`Failed to list models: ${error.message}`);
    }
  }

  /**
   * Send a chat request with conversation history
   */
  async chat(request: OllamaChatRequest): Promise<OllamaChatResponse> {
    try {
      const response = await this.client.post("/api/chat", {
        model: request.model || this.defaultModel,
        messages: request.messages,
        stream: false, // Non-streaming response
        format: request.format,
        options: request.options,
      });

      return response.data;
    } catch (error: any) {
      console.error("Chat request failed:", error.message);
      throw new Error(`Chat request failed: ${error.message}`);
    }
  }

  /**
   * Send a chat request with streaming response
   * Returns a stream of response chunks
   */
  async chatStream(request: OllamaChatRequest, onChunk: (chunk: OllamaChatResponse) => void): Promise<void> {
    try {
      const response = await this.client.post(
        "/api/chat",
        {
          model: request.model || this.defaultModel,
          messages: request.messages,
          stream: true,
          format: request.format,
          options: request.options,
        },
        {
          responseType: "stream",
        },
      );

      return new Promise((resolve, reject) => {
        response.data.on("data", (chunk: Buffer) => {
          const lines = chunk.toString().split("\n").filter(Boolean);
          lines.forEach((line) => {
            try {
              const data = JSON.parse(line);
              onChunk(data);
            } catch (e) {
              console.error("Failed to parse chunk:", e);
            }
          });
        });

        response.data.on("end", () => resolve());
        response.data.on("error", (error: any) => reject(error));
      });
    } catch (error: any) {
      console.error("Chat stream request failed:", error.message);
      throw new Error(`Chat stream request failed: ${error.message}`);
    }
  }

  /**
   * Generate a completion from a prompt
   */
  async generate(request: OllamaGenerateRequest): Promise<OllamaGenerateResponse> {
    try {
      const response = await this.client.post("/api/generate", {
        model: request.model || this.defaultModel,
        prompt: request.prompt,
        stream: false,
        format: request.format,
        options: request.options,
      });
      return response.data;
    } catch (error: any) {
      console.error("Generate request failed:", error.message);
      throw new Error(`Generate request failed: ${error.message}`);
    }
  }

  /**
   * Generate a completion with streaming response
   */
  async generateStream(
    request: OllamaGenerateRequest,
    onChunk: (chunk: OllamaGenerateResponse) => void,
  ): Promise<void> {
    try {
      const response = await this.client.post(
        "/api/generate",
        {
          model: request.model || this.defaultModel,
          prompt: request.prompt,
          stream: true,
          format: request.format,
          options: request.options,
        },
        {
          responseType: "stream",
        },
      );

      return new Promise((resolve, reject) => {
        response.data.on("data", (chunk: Buffer) => {
          const lines = chunk.toString().split("\n").filter(Boolean);
          lines.forEach((line) => {
            try {
              const data = JSON.parse(line);
              onChunk(data);
            } catch (e) {
              console.error("Failed to parse chunk:", e);
            }
          });
        });

        response.data.on("end", () => resolve());
        response.data.on("error", (error: any) => reject(error));
      });
    } catch (error: any) {
      console.error("Generate stream request failed:", error.message);
      throw new Error(`Generate stream request failed: ${error.message}`);
    }
  }

  /**
   * Pull a model from the Ollama library
   */
  async pullModel(modelName: string): Promise<void> {
    try {
      const response = await this.client.post(
        "/api/pull",
        {
          name: modelName,
          stream: false,
        },
        {
          timeout: 600000, // 10 minutes for model download
        },
      );
      return response.data;
    } catch (error: any) {
      console.error("Model pull failed:", error.message);
      throw new Error(`Model pull failed: ${error.message}`);
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(modelName: string): Promise<void> {
    try {
      await this.client.delete("/api/delete", {
        data: { name: modelName },
      });
    } catch (error: any) {
      console.error("Model deletion failed:", error.message);
      throw new Error(`Model deletion failed: ${error.message}`);
    }
  }

  /**
   * Check if Ollama is running
   */
  async isRunning(): Promise<boolean> {
    try {
      await this.client.get("/api/tags");
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the default model name
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }

  /**
   * Set the default model name
   */
  setDefaultModel(modelName: string): void {
    this.defaultModel = modelName;
  }
}
