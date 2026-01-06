import express, { Request, Response } from "express";
import { AIService } from "../services";
import { body, param } from "express-validator";
import { ReturnValidationErrors } from "../middleware";
import { db } from "../data";
import { DB_SCHEMA } from "../config";

export const aiRouter = express.Router();
const aiService = new AIService();

// Test connection to Ollama
aiRouter.get("/", async (req: Request, res: Response) => {
  try {
    const isRunning = await aiService.isRunning();
    if (isRunning) {
      const connectionInfo = await aiService.connect();
      return res.json({ data: connectionInfo });
    } else {
      return res.status(503).json({
        error: "Ollama is not running",
        messages: [{ variant: "error", text: "Ollama service is not available" }],
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
      messages: [{ variant: "error", text: "Failed to connect to Ollama" }],
    });
  }
});

// Get list of available models
aiRouter.get("/models", async (req: Request, res: Response) => {
  try {
    const models = await aiService.listModels();
    return res.json({ data: models });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
      messages: [{ variant: "error", text: "Failed to list models" }],
    });
  }
});

// Get default model
aiRouter.get("/models/default", async (req: Request, res: Response) => {
  try {
    const defaultModel = aiService.getDefaultModel();
    return res.json({ data: { model: defaultModel } });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Set default model
aiRouter.put(
  "/models/default",
  [body("model").notEmpty().isString()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { model } = req.body;
      aiService.setDefaultModel(model);
      return res.json({
        data: { model },
        messages: [{ variant: "success", text: "Default model updated" }],
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

// Pull a model
aiRouter.post(
  "/models/pull",
  [body("modelName").notEmpty().isString()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { modelName } = req.body;
      await aiService.pullModel(modelName);
      return res.json({
        data: { modelName },
        messages: [{ variant: "success", text: `Model ${modelName} pulled successfully` }],
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message,
        messages: [{ variant: "error", text: `Failed to pull model: ${error.message}` }],
      });
    }
  }
);

// Delete a model
aiRouter.delete(
  "/models/:modelName",
  [param("modelName").notEmpty().isString()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { modelName } = req.params;
      await aiService.deleteModel(modelName);
      return res.json({
        messages: [{ variant: "success", text: `Model ${modelName} deleted successfully` }],
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message,
        messages: [{ variant: "error", text: `Failed to delete model: ${error.message}` }],
      });
    }
  }
);

// Chat endpoint (non-streaming)
aiRouter.post(
  "/chat",
  [body("messages").isArray().notEmpty(), body("model").optional().isString(), body("options").optional().isObject()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { messages, model, options, format, questionId } = req.body;

      if (!questionId) {
        return res.status(400).json({
          error: "Invalid question ID",
          messages: [{ variant: "error", text: "No question ID provided" }],
        });
      }
      const question = await db("QUESTION").withSchema(DB_SCHEMA).where({ QID: questionId }).first();

      if (!question) {
        return res.status(400).json({
          error: "Invalid question ID",
          messages: [{ variant: "error", text: "The provided question ID does not exist" }],
        });
      }

      const prompt = question.PROMPT || "";
      messages.unshift({ role: "system", content: prompt });

      console.log("Messages with system prompt:", messages);

      const response = await aiService.chat({
        model,
        messages,
        format,
        options,
      });
      return res.json({ data: response });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message,
        messages: [{ variant: "error", text: `Chat request failed: ${error.message}` }],
      });
    }
  }
);

// Chat endpoint (streaming)
aiRouter.post(
  "/chat/stream",
  [body("messages").isArray().notEmpty(), body("model").optional().isString(), body("options").optional().isObject()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { messages, model, options, format } = req.body;

      // Set headers for streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      await aiService.chatStream(
        {
          model,
          messages,
          format,
          options,
        },
        (chunk) => {
          // Send chunk as Server-Sent Event
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
      );

      res.end();
    } catch (error: any) {
      if (!res.headersSent) {
        return res.status(500).json({
          error: error.message,
          messages: [{ variant: "error", text: `Chat stream failed: ${error.message}` }],
        });
      }
    }
  }
);

// Generate endpoint (non-streaming)
aiRouter.post(
  "/generate",
  [body("prompt").isString().notEmpty(), body("model").optional().isString(), body("options").optional().isObject()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { prompt, model, options, format } = req.body;
      const response = await aiService.generate({
        model,
        prompt,
        format,
        options,
      });
      return res.json({ data: response });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message,
        messages: [{ variant: "error", text: `Generate request failed: ${error.message}` }],
      });
    }
  }
);

// Generate endpoint (streaming)
aiRouter.post(
  "/generate/stream",
  [body("prompt").isString().notEmpty(), body("model").optional().isString(), body("options").optional().isObject()],
  ReturnValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { prompt, model, options, format } = req.body;

      // Set headers for streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      await aiService.generateStream(
        {
          model,
          prompt,
          format,
          options,
        },
        (chunk) => {
          // Send chunk as Server-Sent Event
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
      );

      res.end();
    } catch (error: any) {
      if (!res.headersSent) {
        return res.status(500).json({
          error: error.message,
          messages: [{ variant: "error", text: `Generate stream failed: ${error.message}` }],
        });
      }
    }
  }
);
