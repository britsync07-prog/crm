import axios, { AxiosInstance, AxiosError } from "axios";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

const BASE_URL = process.env.BRITLEDGER_API_URL || "https://ledger.britsyncai.com/api/v1";
const GLOBAL_EMAIL = process.env.BRITLEDGER_EMAIL || "";
const GLOBAL_PASSWORD = process.env.BRITLEDGER_PASSWORD || "";

interface TokenEntry {
  token: string;
  expiry: number;
}

const tokenCache = new Map<string, TokenEntry>();

function derivePassword(userId: string): string {
  const secret = process.env.JWT_SECRET || "default_hmac_secret_key_123";
  return crypto.createHmac("sha256", secret).update(userId).digest("hex");
}

function ledgerAliasEmail(userId: string): string {
  return `${userId}@britcrm.local`;
}

function isDuplicateAccountError(err: any): boolean {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const text = typeof data === "string" ? data : JSON.stringify(data || {});
  return status === 409 || /already exists|duplicate key|users_email_key/i.test(text);
}

async function loginUser(email: string, password: string): Promise<string> {
  const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
  return res.data.access_token;
}

async function registerUser(userId: string, email: string, password: string): Promise<string> {
  const emailPrefix = email.split("@")[0];
  const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
    id: userId,
    email,
    password,
    first_name: emailPrefix,
    last_name: "User",
  });
  return registerRes.data.data.access_token;
}

async function loginGlobal(): Promise<string> {
  if (!GLOBAL_EMAIL || !GLOBAL_PASSWORD) {
    throw new Error("Missing global BritLedger credentials (BRITLEDGER_EMAIL or BRITLEDGER_PASSWORD).");
  }
  const res = await axios.post(`${BASE_URL}/auth/login`, {
    email: GLOBAL_EMAIL,
    password: GLOBAL_PASSWORD,
  });
  return res.data.access_token;
}

async function loginOrRegisterUser(userId: string, email: string): Promise<string> {
  const password = derivePassword(userId);
  try {
    return await loginUser(email, password);
  } catch (err: any) {
    if (err?.response?.status === 401 || err?.response?.status === 404) {
      try {
        return await registerUser(userId, email, password);
      } catch (regErr: any) {
        if (!isDuplicateAccountError(regErr)) {
          console.error(`[BritLedger client] Auto-registration failed for user ${userId} (${email}):`, regErr?.response?.data || regErr.message);
          throw regErr;
        }

        const aliasEmail = ledgerAliasEmail(userId);
        try {
          return await loginUser(aliasEmail, password);
        } catch {
          try {
            return await registerUser(userId, aliasEmail, password);
          } catch (aliasErr: any) {
            console.error(`[BritLedger client] Alias registration failed for CRM user ${userId}:`, aliasErr?.response?.data || aliasErr.message);
            throw aliasErr;
          }
        }
      }
    }
    console.error(`[BritLedger client] Login failed for user ${userId} (${email}):`, err?.response?.data || err.message);
    throw err;
  }
}

async function ensureToken(userId?: string, email?: string): Promise<string> {
  const cacheKey = userId || "global";
  const cached = tokenCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return cached.token;
  }

  let token: string;
  if (userId && email) {
    token = await loginOrRegisterUser(userId, email);
  } else {
    token = await loginGlobal();
  }

  tokenCache.set(cacheKey, {
    token,
    expiry: Date.now() + 25 * 60 * 1000,
  });
  return token;
}

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  try {
    const session = await getSession().catch(() => null);
    let token: string;
    if (session && session.id && session.email) {
      token = await ensureToken(session.id, session.email);
    } else {
      throw new Error("BritLedger requests require an authenticated CRM session.");
    }
    config.headers.Authorization = `Bearer ${token}`;
  } catch (err: any) {
    console.error("[BritLedger client] Request interceptor error:", err.message);
    return Promise.reject(err);
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const session = await getSession().catch(() => null);
      const cacheKey = session?.id || "global";
      tokenCache.delete(cacheKey);
      
      const config = error.config;
      if (config) {
        try {
          let token: string;
          if (session && session.id && session.email) {
            token = await ensureToken(session.id, session.email);
          } else {
            throw new Error("BritLedger retry requires an authenticated CRM session.");
          }
          config.headers.Authorization = `Bearer ${token}`;
          return axios(config);
        } catch (retryErr) {
          return Promise.reject(retryErr);
        }
      }
    }
    return Promise.reject(error);
  }
);

interface CacheEntry {
  data: unknown;
  expiry: number;
}
const getCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15_000;

function getCached<T>(key: string): T | null {
  const entry = getCache.get(key);
  if (entry && Date.now() < entry.expiry) {
    return entry.data as T;
  }
  getCache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  if (getCache.size > 100) {
    const firstKey = getCache.keys().next().value;
    if (firstKey) getCache.delete(firstKey);
  }
  getCache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}

export async function britGet<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const session = await getSession().catch(() => null);
  const userPrefix = session?.id ? `${session.id}:` : "global:";
  const cacheKey = userPrefix + endpoint + JSON.stringify(params ?? {});
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;
  const res = await api.get(endpoint, { params });
  setCache(cacheKey, res.data);
  return res.data;
}

export async function britPost<T>(endpoint: string, data?: any): Promise<T> {
  const res = await api.post(endpoint, data);
  return res.data;
}

export async function britPut<T>(endpoint: string, data?: any): Promise<T> {
  const res = await api.put(endpoint, data);
  return res.data;
}

export async function britDelete<T>(endpoint: string): Promise<T> {
  const res = await api.delete(endpoint);
  return res.data;
}

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    getCache.clear();
    return;
  }
  for (const key of getCache.keys()) {
    if (key.includes(pattern)) getCache.delete(key);
  }
}
