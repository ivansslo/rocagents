import "dotenv/config";
import dns from "dns";
import { GoogleGenAI, FunctionDeclaration } from "@google/genai";
import { db } from "./db";
import { executeTool } from "./tools";

if (dns && dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

export type OrchestratorProgressEvent = {
  type: 'status' | 'tool_start' | 'tool_result' | 'chunk';
  data: any;
};

export type OrchestratorOptions = {
  model?: string;
  provider?: string;
  onProgress?: (event: OrchestratorProgressEvent) => void;
};

const SYSTEM_PROMPT = "You are a professional and efficient AI assistant. You have access to tools for file operations and system commands. When asked to make changes, execute the necessary tool calls directly and provide concise explanations of your actions.";

function getDynamicSystemPrompt(userMsg?: string) {
  const memories = db.getMemories();
  let contextMemories = memories.slice(-5);
  
  if (userMsg) {
    const lower = userMsg.toLowerCase();
    const relevant = memories.filter(m => 
      lower.includes(m.key.toLowerCase()) || 
      m.value.toLowerCase().split(' ').some(word => word.length > 4 && lower.includes(word))
    ).slice(0, 5);
    if (relevant.length > 0) contextMemories = relevant;
  }

  const memoryContext = contextMemories.length > 0 
    ? "\n\nCONTEXT:\n" + contextMemories.map(m => `- ${m.key}: ${m.value}`).join("\n")
    : "";
  
  return `${SYSTEM_PROMPT}${memoryContext}`;
}

async function generateContentWithRetry(ai: any, params: any, onProgress?: any, maxRetries = 3): Promise<any> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      if (err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED')) {
        attempt++;
        if (attempt >= maxRetries) throw err;
        
        let retryDelay = 32000;
        const match = err?.message?.match(/retry in (\d+(?:\.\d+)?)s/i);
        if (match && match[1]) {
          retryDelay = Math.ceil(parseFloat(match[1])) * 1000 + 2000;
        } else if (err?.details) {
          const retryInfo = err.details.find((d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
          if (retryInfo && retryInfo.retryDelay) {
            retryDelay = parseInt(retryInfo.retryDelay) * 1000 + 2000;
          }
        }
        
        onProgress?.({ type: 'status', data: { message: `Rate limit hit. Retrying in ${Math.round(retryDelay/1000)} seconds...` } });
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        throw err;
      }
    }
  }
}

async function callGemini(messages: any[], modelName: string, executionLogs: any[], onProgress?: (event: OrchestratorProgressEvent) => void) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const ai = new GoogleGenAI({ 
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const tools = db.getTools();
  const functionDeclarations: FunctionDeclaration[] = tools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters
  }));

  const contents = messages
    .filter(m => m.text || m.image)
    .map(m => {
      const parts: any[] = [];
      if (m.text) parts.push({ text: m.text });
      if (m.image) {
        parts.push({
          inlineData: {
            data: m.image.data,
            mimeType: m.image.mimeType
          }
        });
      }
      return { role: m.role === 'model' ? 'model' : 'user', parts };
    });

  while (contents.length > 0 && contents[0].role === 'model') {
    contents.shift();
  }

  if (contents.length === 0) return { text: "I'm ready to help.", logs: [] };

  const targetModel = modelName === 'gemini-1.5-flash' ? 'gemini-3.6-flash' : (modelName === 'gemini-1.5-pro' ? 'gemini-3.1-pro-preview' : modelName);

  onProgress?.({ type: 'status', data: { message: `Connecting to Gemini (${targetModel})...` } });

  let response = await generateContentWithRetry(ai, {
    model: targetModel || "gemini-3.6-flash",
    contents,
    config: {
      systemInstruction: getDynamicSystemPrompt(messages[messages.length - 1]?.text),
      tools: [{ functionDeclarations }],
    },
  }, onProgress);

  let turnCount = 0;
  let currentResponse = response;

  while (currentResponse.functionCalls && turnCount < 10) {
    turnCount++;
    const functionCalls = currentResponse.functionCalls;
    if (!functionCalls) break;

    const toolResponses = await Promise.all(functionCalls.map(async (call) => {
      const toolName = call.name;
      const toolArgs = call.args;

      onProgress?.({ type: 'tool_start', data: { toolName, toolArgs } });
      const result = await executeTool(toolName, toolArgs);
      
      executionLogs.push({ toolName, args: toolArgs, result });
      onProgress?.({ type: 'tool_result', data: { toolName, result } });

      return {
        functionResponse: {
          name: toolName,
          response: result
        }
      };
    }));

    contents.push(currentResponse.candidates![0].content as any);
    contents.push({ role: "user", parts: toolResponses } as any);

    response = await generateContentWithRetry(ai, {
      model: targetModel || "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction: getDynamicSystemPrompt(messages[messages.length - 1]?.text),
        tools: [{ functionDeclarations }],
      },
    }, onProgress);
    currentResponse = response;
  }

  const text = currentResponse.text || "";
  onProgress?.({ type: 'chunk', data: { text } });
  return { text, logs: executionLogs };
}

export async function runOrchestrator(messages: any[], options: OrchestratorOptions = {}) {
  const executionLogs: any[] = [];
  const onProgress = options.onProgress;
  const model = options.model || "gemini-3.6-flash";

  try {
    return await callGemini(messages, model, executionLogs, onProgress);
  } catch (err: any) {
    console.error("Orchestrator error:", err);
    return {
      text: `Error processing request: ${err.message}. Please check your configuration.`,
      logs: executionLogs
    };
  }
}
