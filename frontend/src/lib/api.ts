import type {
  Bond,
  BondStatus,
  CreateBondResponse,
  HealthResponse,
  ListBondsResponse,
  OcrBondPayload,
  UploadBondResponse,
} from "./types";

export interface OcrOnlyResponse {
  success: boolean;
  ocr_data: OcrBondPayload;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  detail?: string;
  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body && !(init.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...(init.headers || {}),
      },
      cache: "no-store",
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new ApiError(
      `تعذّر الاتصال بالخادم على ${API_BASE_URL}. تحقّق من تشغيل واجهة Tahseel API.`,
      0,
      reason === "Failed to fetch" ? undefined : reason
    );
  }

  if (!res.ok) {
    let detail: string | undefined;
    try {
      const data = await res.json();
      detail = typeof data?.detail === "string" ? data.detail : JSON.stringify(data);
    } catch {
      detail = await res.text().catch(() => undefined);
    }
    throw new ApiError(
      friendlyStatusMessage(res.status),
      res.status,
      detail
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function friendlyStatusMessage(status: number): string {
  if (status === 400) return "الطلب غير صالح.";
  if (status === 422) return "البيانات المُرسلة غير مكتملة أو غير صحيحة.";
  if (status === 404) return "العنصر المطلوب غير موجود.";
  if (status >= 500) return "خطأ في الخادم. حاول مرّة أخرى لاحقاً.";
  return "حدث خطأ غير متوقّع.";
}

export const api = {
  health: () => request<HealthResponse>("/health"),

  listBonds: (params: { status?: BondStatus | "all"; limit?: number } = {}) => {
    const search = new URLSearchParams();
    if (params.status && params.status !== "all") search.set("status", params.status);
    if (params.limit) search.set("limit", String(params.limit));
    const qs = search.toString();
    return request<ListBondsResponse>(`/api/bonds${qs ? `?${qs}` : ""}`);
  },

  createBondFromOcr: (payload: OcrBondPayload) =>
    request<CreateBondResponse>("/api/bonds", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  uploadBondImage: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<UploadBondResponse>("/api/bonds/upload", {
      method: "POST",
      body: form,
    });
  },

  // OCR only — extracts data from image WITHOUT saving to Supabase
  extractBondOcr: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<OcrOnlyResponse>("/api/bonds/ocr", {
      method: "POST",
      body: form,
    });
  },
};

export type ListBondsParams = Parameters<typeof api.listBonds>[0];
export type Bonds = Bond[];
