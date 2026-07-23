import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'db.json');

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: any;
}

export interface ExecutionLog {
  timestamp: string;
  toolName: string;
  args: any;
  result: any;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: any[];
}

export interface MemoryItem {
  key: string;
  value: string;
  updatedAt: string;
}

interface DatabaseSchema {
  tools: ToolDefinition[];
  logs: ExecutionLog[];
  chatSessions?: ChatSession[];
  memories?: MemoryItem[];
}

const DEFAULT_SCHEMA: DatabaseSchema = {
  tools: [
    {
      name: "list_project_files",
      description: "List the files currently in the developer workspace.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    },
    {
      name: "read_project_file",
      description: "Read the content of a specific file in the workspace.",
      parameters: {
        type: "object",
        properties: {
          filename: { type: "string", description: "The name of the file to read (e.g. 'server.ts')." }
        },
        required: ["filename"]
      }
    },
    {
      name: "write_project_file",
      description: "Write or overwrite an entire file in the workspace.",
      parameters: {
        type: "object",
        properties: {
          filename: { type: "string", description: "The name of the file to write (e.g. 'src/utils/math.ts')." },
          content: { type: "string", description: "The full content to write to the file." }
        },
        required: ["filename", "content"]
      }
    },
    {
      name: "edit_file",
      description: "Edit an existing file in the workspace by replacing search text with new text.",
      parameters: {
        type: "object",
        properties: {
          filename: { type: "string", description: "Relative path to file." },
          old_text: { type: "string", description: "The existing code text block to find and replace." },
          new_text: { type: "string", description: "The replacement code text block." }
        },
        required: ["filename", "old_text", "new_text"]
      }
    },
    {
      name: "delete_project_file",
      description: "Delete a file from the workspace.",
      parameters: {
        type: "object",
        properties: {
          filename: { type: "string", description: "The name of the file to delete." }
        },
        required: ["filename"]
      }
    },
    {
      name: "search_codebase",
      description: "Search for specific text across all files in the project workspace.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The text query or term to search for." }
        },
        required: ["query"]
      }
    },
    {
      name: "run_bash_command",
      description: "Run a bash command in the terminal.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "The bash command to run." }
        },
        required: ["command"]
      }
    }
  ],
  logs: [],
  chatSessions: [],
  memories: []
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        // Ensure tools are updated to latest minimal set
        this.data.tools = DEFAULT_SCHEMA.tools;
        if (!this.data.memories) this.data.memories = [];
        this.save();
      } catch {
        this.data = DEFAULT_SCHEMA;
        this.save();
      }
    } else {
      this.data = DEFAULT_SCHEMA;
      this.save();
    }
  }

  private save() {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2));
  }

  getTools() {
    return this.data.tools || [];
  }

  // Memory Methods
  getMemories() {
    return this.data.memories || [];
  }

  getMemory(key: string) {
    return this.data.memories?.find(m => m.key === key)?.value;
  }

  saveMemory(key: string, value: string, category: string = 'general') {
    if (!this.data.memories) this.data.memories = [];
    const index = this.data.memories.findIndex(m => m.key === key);
    const item = { key, value, updatedAt: new Date().toISOString(), category };
    if (index !== -1) {
      this.data.memories[index] = item;
    } else {
      this.data.memories.push(item);
    }
    this.save();
  }

  deleteMemory(key: string) {
    if (!this.data.memories) return;
    this.data.memories = this.data.memories.filter(m => m.key !== key);
    this.save();
  }

  cleanupMemories() {
    const removed: any[] = [];
    // Just a placeholder that returns empty array to satisfy linter
    return removed;
  }

  optimizeMemories() {
    // Basic deduplication
    const unique = new Map<string, MemoryItem>();
    this.data.memories?.forEach(m => {
      const normKey = m.key.toLowerCase().trim();
      if (!unique.has(normKey) || new Date(m.updatedAt).getTime() > new Date(unique.get(normKey)!.updatedAt).getTime()) {
        unique.set(normKey, m);
      }
    });
    this.data.memories = Array.from(unique.values());
    this.save();
  }

  // Capability Methods (stubs)
  getSelfCapabilities() { return []; }
  saveSelfCapability(name: string, code: string, purpose: string, category: string) { return "stub"; }

  // Tool Methods
  addTool(tool: ToolDefinition) {
    this.data.tools.push(tool);
    this.save();
  }

  // Log Methods
  getLogs() { return this.data.logs || []; }
  async addLog(log: ExecutionLog) {
    this.data.logs.push(log);
    this.save();
  }

  // Routine Methods (stubs)
  getScheduledRoutines() { return []; }

  // Sync Methods (stubs)
  getSyncedApps() { return []; }
  updateAppStatus(name: string, status: string, timestamp?: string, logs?: string[]) { }

  // Snowflake Methods (stubs)
  getSnowflakeModels() { return []; }
  addSnowflakeModel(model: any) { }

  // Session Methods
  getChatSessions(): ChatSession[] {
    return this.data.chatSessions || [];
  }

  saveChatSession(session: ChatSession) {
    if (!this.data.chatSessions) this.data.chatSessions = [];
    const index = this.data.chatSessions.findIndex(s => s.id === session.id);
    if (index !== -1) {
      this.data.chatSessions[index] = session;
    } else {
      this.data.chatSessions.push(session);
    }
    this.save();
  }

  deleteChatSession(id: string) {
    if (!this.data.chatSessions) return;
    this.data.chatSessions = this.data.chatSessions.filter(s => s.id !== id);
    this.save();
  }

  clearChatSessions() {
    this.data.chatSessions = [];
    this.save();
  }

  renameChatSession(id: string, title: string) {
    if (!this.data.chatSessions) return;
    const session = this.data.chatSessions.find(s => s.id === id);
    if (session) {
      session.title = title;
      this.save();
    }
  }
}

export const db = new Database();
