export interface McpLogEntry {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  ip?: string;
  userAgent?: string;
  userId?: string;
  userEmail?: string;
  rpcMethod?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  status: number;
  durationMs: number;
  success: boolean;
  error?: string;
  details?: unknown;
}

const MAX_LOGS = 100;
const logBuffer: McpLogEntry[] = [];

export function recordMcpLog(entry: Omit<McpLogEntry, "id" | "timestamp">) {
  const fullEntry: McpLogEntry = {
    id: `mcp-log-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };

  logBuffer.unshift(fullEntry);
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.pop();
  }

  // Print readable formatted debug log to terminal / PM2 stdout
  const toolInfo = fullEntry.toolName ? ` | Tool: ${fullEntry.toolName}` : "";
  const rpcInfo = fullEntry.rpcMethod ? ` | RPC: ${fullEntry.rpcMethod}` : "";
  const userInfo = fullEntry.userEmail ? ` | User: ${fullEntry.userEmail}` : "";
  const statusInfo = fullEntry.success ? "SUCCESS" : `FAILED (${fullEntry.error || "Unknown error"})`;

  const isStdio = typeof process !== "undefined" && process.env.MCP_MODE === "stdio";
  const logFn = isStdio ? console.error : console.log;

  logFn(
    `[MCP-DEBUG] ${fullEntry.timestamp} | ${fullEntry.method} ${fullEntry.url}${rpcInfo}${toolInfo}${userInfo} | Status: ${fullEntry.status} (${statusInfo}) in ${fullEntry.durationMs}ms`
  );

  if (fullEntry.toolArgs && Object.keys(fullEntry.toolArgs).length > 0) {
    const sanitizedArgs = { ...fullEntry.toolArgs };
    delete (sanitizedArgs as any).password;
    delete (sanitizedArgs as any).token;
    delete (sanitizedArgs as any).secret;
    delete (sanitizedArgs as any).apiKey;
    logFn(`[MCP-DEBUG-ARGS] Tool Params:`, JSON.stringify(sanitizedArgs).slice(0, 300));
  }

  return fullEntry;
}

export function logMcpDebug(message: string, details?: unknown) {
  const isStdio = typeof process !== "undefined" && process.env.MCP_MODE === "stdio";
  const logFn = isStdio ? console.error : console.log;
  const timestamp = new Date().toISOString();

  let detailsStr = "";
  if (details !== undefined) {
    try {
      if (typeof details === "object" && details !== null) {
        const sanitized = { ...(details as any) };
        delete sanitized.password;
        delete sanitized.token;
        delete sanitized.secret;
        delete sanitized.apiKey;
        detailsStr = " | " + JSON.stringify(sanitized);
      } else {
        detailsStr = " | " + String(details);
      }
      if (detailsStr.length > 500) {
        detailsStr = detailsStr.slice(0, 500) + "...";
      }
    } catch {
      detailsStr = " | [Unserializable]";
    }
  }

  logFn(`[MCP DEBUG] ${timestamp} | ${message}${detailsStr}`);
}

export function getRecentMcpLogs(limit = 50): McpLogEntry[] {
  return logBuffer.slice(0, limit);
}
