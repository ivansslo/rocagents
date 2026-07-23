import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import cron from "node-cron";
import { runOrchestrator } from "./server/orchestrator";
import { db } from "./server/db";
import { initScheduler } from "./server/scheduler";

import axios from "axios";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  // Initialize scheduler
  initScheduler();

  // Automated daily backup
  const performBackup = () => {
    const routines = db.getSelfCapabilities();
    const logs = db.getLogs();
    const backupData = {
      routines,
      logs: logs.filter(l => l.toolName === 'self_develop_capability'),
      timestamp: new Date().toISOString()
    };

    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    const filename = `routines_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(path.join(backupDir, filename), JSON.stringify(backupData, null, 2));
    console.log(`Backup saved: ${filename}`);
  };

  cron.schedule("0 0 * * *", performBackup);

  // GET all routines
  app.get("/api/routines", (req, res) => {
    res.json(db.getScheduledRoutines());
  });

  // POST create routine
  app.post("/api/routines", (req, res) => {
    const { name, cron, capabilityName } = req.body;
    if (!name || !cron || !capabilityName) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const id = db.saveScheduledRoutine(name, cron, capabilityName);
    // In a real app, we would reload the cron jobs here.
    // For now, restarting server or just reloading is needed.
    // Since we are in an agentic flow, maybe I can trigger a restart or just notify the user.
    res.json({ id });
  });

  // GET capability logs
  app.get("/api/capability-logs/:name", (req, res) => {
    const name = req.params.name;
    const logs = db.getLogs();
    const capabilityLogs = logs
      .filter(l => l.toolName === 'self_develop_capability' && l.args.name === name)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
    res.json(capabilityLogs);
  });

  // Increase payload limit for base64 images
  app.use(express.json({ limit: "50mb" }));

  // Initialize Gemini
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
  });

  // GET Synced Apps
  app.get("/api/synced-apps", (req, res) => {
    const apps = [
      {
        id: '1',
        name: 'Orchestrator Core',
        status: 'synced',
        lastSyncedAt: new Date().toISOString(),
        url: 'ivansslo/rocagents',
        componentsCount: 12,
        filesCount: 45,
        apiEndpointsCount: 8,
        description: 'Main ecosystem management and routing module',
        syncLogs: [],
        tier: 'PRO',
        capabilities: ['Vector Memory', 'Auto-Sync']
      },
      {
        id: '3',
        name: 'TidySpace AI',
        status: 'synced',
        lastSyncedAt: new Date().toISOString(),
        url: 'ivansslo/rocagents',
        componentsCount: 8,
        filesCount: 32,
        apiEndpointsCount: 5,
        description: 'Advanced AI self-management and space optimization engine.',
        syncLogs: [],
        tier: 'PRO',
        capabilities: ['Long-term Memory', 'Smart Storage']
      },
      {
        id: '2',
        name: 'Inventory API',
        status: 'synced',
        lastSyncedAt: new Date().toISOString(),
        url: 'ivansslo/inventory-api',
        componentsCount: 5,
        filesCount: 18,
        apiEndpointsCount: 12,
        description: 'Product and stock management microservice',
        syncLogs: [],
        tier: 'FREE',
        capabilities: ['Basic Sync']
      }
    ];
    res.json(apps);
  });

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages array" });
      }

      const result = await runOrchestrator(messages);

      res.json(result);
    } catch (error: any) {
      console.error("Orchestrator Error:", error);
      let errorMessage = error.message || "Failed to process request";
      let statusCode = 500;
      
      if (errorMessage.includes("quota") || errorMessage.includes("429") || error.status === "RESOURCE_EXHAUSTED") {
        errorMessage = "I've reached my limit for now. Please wait a moment and try again!";
        statusCode = 429;
      }
      
      if (errorMessage.includes("demand") || errorMessage.includes("503") || error.status === "UNAVAILABLE") {
        errorMessage = "The service is currently very busy. Please try again in a few seconds.";
        statusCode = 503;
      }
      
      res.status(statusCode).json({ error: errorMessage });
    }
  });

  // POST categorize memory content
  app.post("/api/categorize-memory", async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      const prompt = `Categorize the following memory content into one of these categories: 'ROC AgentsRoute', 'WebVirtCloud', 'lsmod Analyzer', 'General Memory'. 
      Return ONLY the category name.
      Content: "${content}"`;

      const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      const category = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "General Memory";
      
      res.json({ category });
    } catch (err: any) {
      console.error("Categorization error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // GET execution history for a routine
  app.get("/api/routines/:name/history", (req, res) => {
    try {
      const { name } = req.params;
      const logs = db.getLogs().filter(log => 
        log.toolName === "self_develop_capability" && 
        log.args && 
        log.args.name === name
      );
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET all chat sessions
  app.get("/api/chat-sessions", (req, res) => {
    try {
      res.json(db.getChatSessions());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST save or update a chat session
  app.post("/api/chat-sessions", (req, res) => {
    try {
      const { session } = req.body;
      if (!session || !session.id) {
        return res.status(400).json({ error: "Invalid session object" });
      }
      db.saveChatSession(session);
      res.json({ status: "success", session });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE a chat session
  app.delete("/api/chat-sessions/:id", (req, res) => {
    try {
      const { id } = req.params;
      db.deleteChatSession(id);
      res.json({ status: "success", message: `Session ${id} deleted` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT rename a chat session
  app.put("/api/chat-sessions/:id/rename", (req, res) => {
    try {
      const { id } = req.params;
      const { title } = req.body;
      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }
      db.renameChatSession(id, title);
      res.json({ status: "success", id, title });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST execute shell command
  app.post("/api/execute-shell", (req, res) => {
    try {
      const { command } = req.body;
      if (!command) {
        return res.status(400).json({ error: "Command is required" });
      }

      const { exec } = require('child_process');
      exec(command, { cwd: process.cwd(), timeout: 30000 }, (error: any, stdout: string, stderr: string) => {
        res.json({
          stdout: stdout || "",
          stderr: stderr || "",
          exitCode: error ? error.code : 0,
          error: error ? error.message : null
        });
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GitHub OAuth Implementation
  app.get("/api/auth/github/url", (req, res) => {
    try {
      const clientId = process.env.GITHUB_CLIENT_ID;
      if (!clientId) {
        return res.status(400).json({ error: "GITHUB_CLIENT_ID is not set in environment variables." });
      }

      // Determine the app URL - favor APP_URL if set, otherwise derive from request
      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const redirectUri = `${baseUrl.replace(/\/$/, '')}/auth/github/callback`;
      
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user`;
      
      res.json({ url: authUrl });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get(["/auth/github/callback", "/auth/github/callback/"], async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.send(`<html><body style="background:#000;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh">No code provided. Closing...<script>setTimeout(() => window.close(), 2000);</script></body></html>`);
      }

      if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
        return res.status(500).send("GitHub Credentials not configured on server.");
      }

      const response = await axios.post("https://github.com/login/oauth/access_token", {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }, {
        headers: { Accept: "application/json" }
      });

      if (response.data.error) {
        throw new Error(response.data.error_description || response.data.error);
      }

      const accessToken = response.data.access_token;
      
      // Send token to parent window via postMessage and close
      res.send(`
        <html>
          <body style="background: #09090b; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="text-align: center;">
              <h2 style="color: #6366f1;">GitHub Connected!</h2>
              <p style="color: #a1a1aa; font-size: 14px;">Syncing your repositories now...</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS', token: '${accessToken}' }, '*');
                  setTimeout(() => window.close(), 1000);
                } else {
                  window.location.href = '/';
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (err: any) {
      res.status(500).send(`Error: ${err.message}`);
    }
  });

  // GET GitHub repositories
  app.get("/api/github/repos", async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1] || process.env.GITHUB_PAT;
      if (!token) {
        return res.status(401).json({ error: "Unauthorized: GitHub token or GITHUB_PAT is required" });
      }

      const response = await axios.get("https://api.github.com/user/repos?sort=updated&per_page=100", {
        headers: { Authorization: `token ${token}` }
      });

      res.json(response.data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET GitHub repository contents
  app.get("/api/github/repos/:owner/:repo/contents*", async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1] || process.env.GITHUB_PAT;
      if (!token) return res.status(401).json({ error: "Unauthorized: GitHub token or GITHUB_PAT is required" });

      const { owner, repo } = req.params;
      const path = req.params[0] || "";
      const ref = req.query.ref as string;

      const url = `https://api.github.com/repos/${owner}/${repo}/contents${path}${ref ? `?ref=${ref}` : ""}`;
      
      const response = await axios.get(url, {
        headers: { 
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json"
        }
      });

      res.json(response.data);
    } catch (err: any) {
      res.status(err.response?.status || 500).json({ error: err.message });
    }
  });

  // PUT Update GitHub file content
  app.put("/api/github/repos/:owner/:repo/contents*", async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1] || process.env.GITHUB_PAT;
      if (!token) return res.status(401).json({ error: "Unauthorized: GitHub token or GITHUB_PAT is required" });

      const { owner, repo } = req.params;
      const path = req.params[0] || "";
      const { message, content, sha, branch } = req.body;

      const url = `https://api.github.com/repos/${owner}/${repo}/contents${path}`;
      
      const response = await axios.put(url, {
        message: message || "Update file via AI Studio",
        content: content, // Must be base64 encoded
        sha: sha,
        branch: branch || "main"
      }, {
        headers: { 
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json"
        }
      });

      res.json(response.data);
    } catch (err: any) {
      console.error("GitHub update error:", err.response?.data || err.message);
      res.status(err.response?.status || 500).json({ error: err.response?.data?.message || err.message });
    }
  });

  // POST Push to GitHub
  app.post("/api/github/push", async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1] || process.env.GITHUB_PAT;
      if (!token) return res.status(401).json({ error: "Unauthorized: GitHub token or GITHUB_PAT is required" });

      const { owner, repo, branch, message } = req.body;
      if (!owner || !repo) return res.status(400).json({ error: "Owner and Repo are required" });

      const repoUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
      
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);

      // Configure git locally
      await execPromise('git config user.email "agent@ais.studio"');
      await execPromise('git config user.name "AI Agent"');
      
      // Check if .git exists, if not init
      if (!fs.existsSync(path.join(process.cwd(), '.git'))) {
        await execPromise('git init');
      }

      // Add remote if not exists or update it
      try {
        await execPromise(`git remote add origin ${repoUrl}`);
      } catch (e) {
        await execPromise(`git remote set-url origin ${repoUrl}`);
      }

      // Add, commit and push
      await execPromise('git add .');
      try {
        await execPromise(`git commit -m "${message || 'Sync from AI Studio'}"`);
      } catch (e) {
        // Fails if nothing to commit
      }
      
      const targetBranch = branch || 'main';
      // Force push or just push? Usually push is safer but if it's a sync repo force might be needed.
      // Let's try regular push first.
      await execPromise(`git push -u origin ${targetBranch}`);

      res.json({ status: "success", message: `Pushed to ${owner}/${repo} (${targetBranch})` });
    } catch (err: any) {
      console.error("Push error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // GET all memories (daya ingat / penyimpanan banyak)
  app.get("/api/memories", (req, res) => {
    try {
      res.json(db.getMemories());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST save a memory
  app.post("/api/memories", (req, res) => {
    try {
      const { key, value, category } = req.body;
      if (!key || !value) {
        return res.status(400).json({ error: "Key and Value are required fields" });
      }
      db.saveMemory(key, value, category || 'general');
      res.json({ status: "success", memory: { key, value, category } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE a memory
  app.delete("/api/memories/:key", (req, res) => {
    try {
      const { key } = req.params;
      db.deleteMemory(key);
      res.json({ status: "success", message: `Memory with key ${key} deleted` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET all self-capabilities
  app.get("/api/self-capabilities", (req, res) => {
    try {
      res.json(db.getSelfCapabilities());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST register a new self-capability (mengembangkan dirinya)
  app.post("/api/self-capabilities", (req, res) => {
    try {
      const { name, codeSnippet, purpose, category } = req.body;
      if (!name || !codeSnippet) {
        return res.status(400).json({ error: "Name and codeSnippet are required fields" });
      }
      const id = db.saveSelfCapability(name, codeSnippet, purpose, category);
      res.json({ status: "success", id, name, purpose, category });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Helper function to list all workspace files with metadata
  function getProjectFilesWithMeta(dirPath: string, arrayOfFiles: any[] = []): any[] {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      if (
        file === "node_modules" ||
        file === "dist" ||
        file === ".git" ||
        file === ".npm" ||
        file === "bun.lock"
      ) {
        return;
      }
      const fullPath = path.join(dirPath, file);
      try {
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          getProjectFilesWithMeta(fullPath, arrayOfFiles);
        } else {
          const relative = path.relative(process.cwd(), fullPath);
          arrayOfFiles.push({
            name: file,
            path: relative,
            size: stats.size,
            updatedAt: stats.mtime.toISOString(),
            isText: /\.(ts|tsx|js|jsx|json|css|html|md|txt|xml|yaml|yml|env|example)$/i.test(file)
          });
        }
      } catch (e) {
        // Skip files that fail stats (e.g. broken symlinks)
      }
    });

    return arrayOfFiles;
  }

  // GET list of all workspace files
  app.get("/api/files", (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      const files = getProjectFilesWithMeta(sessionId ? path.join(process.cwd(), 'sessions', sessionId) : process.cwd());
      res.json(files);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET specific file content
  app.get("/api/files/content", (req, res) => {
    try {
      const filePathQuery = req.query.path as string;
      const sessionId = req.query.sessionId as string;
      if (!filePathQuery) {
        return res.status(400).json({ error: "Path query is required" });
      }
      
      const sessionPath = sessionId ? path.join(process.cwd(), 'sessions', sessionId) : process.cwd();
      const absolutePath = path.join(sessionPath, filePathQuery);
      const relative = path.relative(sessionPath, absolutePath);
      
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        return res.status(400).json({ error: "Invalid path: Access denied outside workspace" });
      }

      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ error: "File not found" });
      }

      const stats = fs.statSync(absolutePath);
      if (stats.isDirectory()) {
        return res.status(400).json({ error: "Path is a directory" });
      }

      const isText = /\.(ts|tsx|js|jsx|json|css|html|md|txt|xml|yaml|yml|env|example)$/i.test(filePathQuery);
      if (isText) {
        const content = fs.readFileSync(absolutePath, "utf-8");
        res.json({ content, isText: true });
      } else {
        const content = fs.readFileSync(absolutePath);
        res.json({ content: content.toString("base64"), isText: false });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE a workspace file
  app.delete("/api/files", (req, res) => {
    try {
      const filePathQuery = req.query.path as string;
      const sessionId = req.query.sessionId as string;
      if (!filePathQuery) {
        return res.status(400).json({ error: "Path query is required" });
      }

      const sessionPath = sessionId ? path.join(process.cwd(), 'sessions', sessionId) : process.cwd();
      const absolutePath = path.join(sessionPath, filePathQuery);
      const relative = path.relative(sessionPath, absolutePath);

      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        return res.status(400).json({ error: "Invalid path: Access denied outside workspace" });
      }

      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ error: "File not found" });
      }

      const stats = fs.statSync(absolutePath);
      if (stats.isDirectory()) {
        return res.status(400).json({ error: "Cannot delete a directory" });
      }

      fs.unlinkSync(absolutePath);
      res.json({ status: "success", message: `Deleted ${filePathQuery}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Upload endpoint
  app.post("/api/upload", async (req, res) => {
    try {
      const { filename, content, isText, sessionId } = req.body;
      if (!filename || content === undefined) {
        return res.status(400).json({ error: "Filename and content are required" });
      }

      const workspaceRoot = sessionId ? path.join(process.cwd(), 'sessions', sessionId) : process.cwd();
      let filePath = filename;
      
      // If filename starts with workspaceRoot, use it as is;
      // otherwise, make it relative to workspaceRoot and join.
      if (filePath.startsWith(workspaceRoot)) {
        // use filePath as is
      } else {
        const relativePath = filePath.replace(/^\/+/, '');
        filePath = path.join(workspaceRoot, relativePath);
      }

      const relative = path.relative(workspaceRoot, filePath);
      
      // Safety check: only allow operations inside workspace
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        return res.status(400).json({ error: "Invalid path: Access denied outside workspace" });
      }

      const parentDir = path.dirname(filePath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      if (isText === false) {
        // Binary content is uploaded as base64 string
        fs.writeFileSync(filePath, Buffer.from(content, 'base64'));
      } else {
        fs.writeFileSync(filePath, content, 'utf-8');
      }

      res.json({ status: "success", message: `Successfully wrote file: ${relative}` });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message || "Failed to upload file" });
    }
  });

  // Get synced apps
  app.get("/api/synced-apps", (req, res) => {
    try {
      res.json(db.getSyncedApps());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Trigger app sync
  app.post("/api/synced-apps/:id/sync", async (req, res) => {
    try {
      const { id } = req.params;
      const apps = db.getSyncedApps();
      const appRecord = apps.find(a => a.id === id);
      if (!appRecord) {
        return res.status(404).json({ error: "App not found" });
      }

      // Simulate a sync with state changes
      db.updateAppStatus(id, 'syncing');
      
      setTimeout(() => {
        const now = new Date().toISOString();
        const logs = [
          `[${now}] Starting sync for ${appRecord.name} at ${appRecord.url}...`,
          `[${now}] Resolving routes and index manifest...`,
          `[${now}] Connected successfully. Found ${appRecord.filesCount} project files.`,
          `[${now}] Indexing UI components (${appRecord.componentsCount} components)...`,
          `[${now}] Discovering API routes (${appRecord.apiEndpointsCount} endpoints)...`,
          `[${now}] Sync finished successfully. Local index updated.`
        ];
        db.updateAppStatus(id, 'synced', now, logs);
      }, 1500);

      res.json({ status: "success", message: `Sync started for ${appRecord.name}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Inspect synced app
  app.get("/api/synced-apps/:id/inspect", (req, res) => {
    try {
      const { id } = req.params;
      const type = req.query.type as string || 'files';
      const apps = db.getSyncedApps();
      const appRecord = apps.find(a => a.id === id);
      if (!appRecord) {
        return res.status(404).json({ error: "App not found" });
      }

      if (appRecord.status !== 'synced') {
        return res.status(400).json({ error: "App must be synced first" });
      }

      if (type === 'files') {
        let files: string[] = [];
        if (id === 'roc-webui') {
          files = [
            "src/components/Dashboard.tsx (UI Widget)",
            "src/components/DeviceGrid.tsx (Robot Status)",
            "src/components/TelemetryChart.tsx (Vitals visualization)",
            "src/components/ControlPanel.tsx (Robot Remote control)",
            "src/hooks/useTelemetry.ts (WS listener)",
            "src/services/api.ts (Endpoint client)"
          ];
        } else if (id === 'roc-otoweb') {
          files = [
            "src/components/MapView.tsx (Route Visualizer)",
            "src/components/WaypointsTable.tsx (Route Waypoints)",
            "src/components/NavigationControl.tsx (Path pilot)",
            "src/hooks/useMapState.ts (Spatial hook)",
            "src/services/navigation.ts (GPS API client)"
          ];
        } else if (id === 'webvirtcloud') {
          files = [
            "webvirtcloud/instances/views.py (VM controls)",
            "webvirtcloud/networks/views.py (Libvirt interfaces)",
            "webvirtcloud/templates/instances.html (Instances grid)",
            "webvirtcloud/api/serializers.py (REST Serializers)",
            "webvirtcloud/libvirt/connection.py (Socket connector)",
            "webvirtcloud/static/js/virtconsole.js (VNC stream hook)"
          ];
        } else if (id === 'lsmod-analyzer') {
          files = [
            "src/kernel/driver_map.c (Symbol table parser)",
            "src/kernel/lsmod_listener.rs (Event listener)",
            "src/kernel/allocator.rs (Host memory linker)",
            "src/kernel/dependencies.rs (Kmod solver)",
            "config/modules.conf (Kmod configuration)"
          ];
        } else if (id === 'roc-space') {
          files = [
            "src/orchestrator/Core.ts (Orchestrator)",
            "src/storage/VectorMemory.ts (Memory Vectorizer)",
            "src/config/ProModules.ts (Module registry)"
          ];
        } else if (id === 'bedrock-agent-core') {
          files = [
            "src/agents/DecisionEngine.ts (Core Engine)",
            "src/agents/MultiAgentBridge.ts (Agent Bridge)"
          ];
        } else if (id === 'webvirt-mgr') {
          files = [
            "src/vm/Manager.ts (VM Manager)",
            "src/vm/Storage.ts (Storage Provider)"
          ];
        } else if (id === 'agent-debate-club') {
          files = [
            "src/debate/Engine.ts (Debate Engine)",
            "src/debate/Consensus.ts (Consensus logic)"
          ];
        } else if (id === 'rofwin') {
          files = [
            "src/protocol/Engine.ts (Protocol Engine)",
            "src/protocol/Telemetry.ts (Telemetry)"
          ];
        } else {
          // roc-agentsroute
          files = [
            "src/agents/Orchestrator.ts (Sub-agent coordinator)",
            "src/routing/MessageBroker.ts (Active pub/sub channels)",
            "src/routing/ActionDelegator.ts (Dynamic command executor)",
            "src/memory/VectorStore.ts (Daya Ingat Embeddings & High-Capacity DB)",
            "src/hooks/useAgentSync.ts (Ecosystem synchronizer)",
            "config/agents_topology.json (Agent network mapping)"
          ];
        }
        res.json({ files });
      } else if (type === 'endpoints') {
        let endpoints: string[] = [];
        if (id === 'roc-webui') {
          endpoints = [
            "GET /api/devices - List fleet devices and connection statuses",
            "GET /api/devices/:id/telemetry - Stream real-time diagnostic indicators",
            "POST /api/devices/:id/command - Issue commands (reboot, halt, move)",
            "GET /api/alerts - Fetch current active system anomalies"
          ];
        } else if (id === 'roc-otoweb') {
          endpoints = [
            "GET /api/routes - List planned navigation waypoints",
            "POST /api/routes - Upload new GPS route pathing",
            "GET /api/navigation/telemetry - Stream spatial orientation and speed logs",
            "PUT /api/routes/:id/active - Set a route as the current active path"
          ];
        } else if (id === 'webvirtcloud') {
          endpoints = [
            "GET /api/v1/servers - List libvirt hypervisors & physical nodes",
            "POST /api/v1/servers/:id/instances - Provision new QEMU virtual guest",
            "POST /api/v1/instances/:id/action - Control power (start, stop, suspend)",
            "GET /api/v1/instances/:id/vnc - Retrieve active websocket RFB consoles"
          ];
        } else if (id === 'lsmod-analyzer') {
          endpoints = [
            "GET /api/kmods/active - Fetch current active loaded kernel modules",
            "POST /api/kmods/load - Dynamically load module driver (insmod)",
            "POST /api/kmods/unload - Unload target driver symbol safely (rmmod)",
            "GET /api/kmods/symbols/:module - Retrieve live module export symbols"
          ];
        } else if (id === 'roc-space') {
          endpoints = [
            "GET /api/v1/memory/stats - Retrieve storage capacity stats",
            "POST /api/v1/modules/sync - Synchronize Pro-modules"
          ];
        } else if (id === 'bedrock-agent-core') {
          endpoints = [
            "GET /api/v1/agents/status - List active agents",
            "POST /api/v1/agents/route - Delegate tasks"
          ];
        } else if (id === 'webvirt-mgr') {
          endpoints = [
            "GET /api/v1/vms - List VMs",
            "POST /api/v1/vms/:id/start - Start VM"
          ];
        } else if (id === 'agent-debate-club') {
          endpoints = [
            "POST /api/debate/start - Start debate",
            "GET /api/debate/result - Get outcome"
          ];
        } else if (id === 'rofwin') {
          endpoints = [
            "GET /api/protocol/status - Get engine status",
            "POST /api/protocol/execute - Execute protocol"
          ];
        } else {
          // roc-agentsroute
          endpoints = [
            "GET /api/v1/agents - List all active registered sub-agents & capacities",
            "POST /api/v1/agents/:id/route - Route dynamic task instructions to target agent",
            "POST /api/v1/memory/vector - Store high-capacity semantic memory blocks (Penyimpanan Banyak)",
            "GET /api/v1/memory/search - Query advanced cognitive long-term memories",
            "PUT /api/v1/agents/sync - Delegate pro-orchestrator synchronized routines"
          ];
        }
        res.json({ endpoints });
      } else {
        res.json({ logs: appRecord.syncLogs || [] });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 404 for all other /api routes
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
