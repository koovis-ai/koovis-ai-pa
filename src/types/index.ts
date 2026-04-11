export interface LoginResponse {
  token: string;
  expires_in: number;
}

export interface JwtPayload {
  sub: string;
  exp: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  cost?: number;
  tool_calls?: ToolCall[];
  isStreaming?: boolean;
  timestamp?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  args?: Record<string, unknown>;
  result?: string;
  status: "pending" | "running" | "complete" | "error";
}

export interface Session {
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface SSEEvent {
  event: string;
  data: string;
}

export interface StatusResponse {
  status: string;
  version: string;
  uptime: number;
  models: Record<string, boolean>;
}

export interface UploadResponse {
  file_id: string;
  filename: string;
  mime_type: string;
  size: number;
}
