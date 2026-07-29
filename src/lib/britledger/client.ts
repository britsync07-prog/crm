import axios, { AxiosInstance, AxiosError } from "axios";

const BASE_URL = process.env.BRITLEDGER_API_URL || "https://ledger.britsyncai.com/api/v1";
const EMAIL = process.env.BRITLEDGER_EMAIL || "";
const PASSWORD = process.env.BRITLEDGER_PASSWORD || "";

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function login(): Promise<string> {
  if (!EMAIL || !PASSWORD) {
    throw new Error("Missing BritLedger credentials (BRITLEDGER_EMAIL or BRITLEDGER_PASSWORD)");
  }
  const res = await axios.post(`${BASE_URL}/auth/login`, {
    email: EMAIL,
    password: PASSWORD,
  });
  const token: string = res.data.access_token;
  cachedToken = token;
  tokenExpiry = Date.now() + 25 * 60 * 1000;
  return token;
}

async function ensureToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  return login();
}

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await ensureToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      cachedToken = null;
      tokenExpiry = 0;
      const config = error.config;
      if (config) {
        const token = await ensureToken();
        config.headers.Authorization = `Bearer ${token}`;
        return axios(config);
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
  const cacheKey = endpoint + JSON.stringify(params ?? {});
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
    if (key.startsWith(pattern)) getCache.delete(key);
  }
}
