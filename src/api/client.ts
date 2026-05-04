const URLS = {
  requirements: "https://functions.poehali.dev/facf1c4c-f09e-47f5-9dba-017ab99e68c8",
  uploadAnalyze: "https://functions.poehali.dev/5b993126-43ca-42ba-952a-5cd686234a40",
  analysisResults: "https://functions.poehali.dev/51c18e84-185b-4b42-a2bc-eb8147c8fbac",
  exportXlsx: "https://functions.poehali.dev/a14705a9-a065-4f43-8234-e82c517b0c77",
  importRequirements: "https://functions.poehali.dev/5fa5ea37-17ec-4297-9c34-bf1b0f5307e8",
};

export interface DBRequirementAPI {
  id: number;
  product: string;
  requirement_group: string;
  requirement: string;
  synonyms: string;
  presence: string;
  check_date: string | null;
  risk_comment: string;
  moi_office: string;
  r7_office: string;
  is_new: boolean;
  proposed_wording: string;
  source: string;
  external_id: string;
  author: string;
  updated_at: string;
  created_by: string;
  created_at: string;
  jira_link: string;
}

export interface AnalysisResult {
  id: number;
  code: string;
  requirement_text: string;
  component: string;
  source_file: string;
  status: "match" | "partial" | "new" | "conflict";
  match_percent: number;
  matched_db_id: number | null;
  matched_text?: string;
  matched_group?: string;
  analyst_comment: string;
  manual_checked: boolean;
}

export interface AnalysisSession {
  id: number;
  file_name: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  total_count: number;
  match_count: number;
  partial_count: number;
  new_count: number;
  conflict_count: number;
}

// --- Requirements DB ---

export async function fetchRequirements(params: {
  product?: string;
  group?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: DBRequirementAPI[]; total: number; products: string[]; groups: string[] }> {
  const qs = new URLSearchParams();
  if (params.product) qs.set("product", params.product);
  if (params.group) qs.set("group", params.group);
  if (params.search) qs.set("search", params.search);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));
  const r = await fetch(`${URLS.requirements}?${qs}`);
  return r.json();
}

export async function createRequirement(data: Partial<DBRequirementAPI>): Promise<{ id: number }> {
  const r = await fetch(URLS.requirements, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function updateRequirement(data: Partial<DBRequirementAPI> & { id: number }): Promise<{ ok: boolean }> {
  const r = await fetch(URLS.requirements, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

// --- Analysis ---

export async function uploadAndAnalyze(
  fileName: string,
  requirements: string[],
  fileBase64?: string
): Promise<{ session_id: number; results: AnalysisResult[]; stats: Record<string, number> }> {
  const r = await fetch(URLS.uploadAnalyze, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file_name: fileName,
      requirements,
      file_data: fileBase64 || "",
    }),
  });
  return r.json();
}

export async function fetchSessions(): Promise<{ sessions: AnalysisSession[] }> {
  const r = await fetch(URLS.analysisResults);
  return r.json();
}

export async function fetchSessionResults(
  sessionId: number
): Promise<{ session: AnalysisSession; results: AnalysisResult[] }> {
  const r = await fetch(`${URLS.analysisResults}?session_id=${sessionId}`);
  return r.json();
}

export async function patchAnalysisResult(
  id: number,
  data: { status?: string; analyst_comment?: string; manual_checked?: boolean }
): Promise<{ ok: boolean }> {
  const r = await fetch(URLS.analysisResults, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });
  return r.json();
}

// --- Export ---

export async function exportToXlsx(sessionId?: number): Promise<void> {
  const url = sessionId
    ? `${URLS.exportXlsx}?session_id=${sessionId}`
    : URLS.exportXlsx;
  const r = await fetch(url);
  const data = await r.json();
  const bytes = Uint8Array.from(atob(data.file_base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = data.file_name;
  a.click();
  URL.revokeObjectURL(a.href);
}

// --- File reading helpers ---

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || "");
    reader.onerror = reject;
    reader.readAsText(file, "utf-8");
  });
}

export async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Разбивает текст файла на отдельные требования.
 * Разделители: нумерованные списки, строки с точкой, пустые строки.
 */
export function extractRequirementsFromText(text: string): string[] {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 20);

  const reqs: string[] = [];
  let buffer = "";
  for (const line of lines) {
    // Нумерованный пункт — новое требование
    if (/^\d+[.)]\s/.test(line)) {
      if (buffer) reqs.push(buffer.trim());
      buffer = line.replace(/^\d+[.)]\s/, "");
    } else if (line.endsWith(".") || line.endsWith(";")) {
      buffer += " " + line;
      reqs.push(buffer.trim());
      buffer = "";
    } else {
      buffer += " " + line;
    }
  }
  if (buffer.trim().length > 20) reqs.push(buffer.trim());
  return reqs.filter((r) => r.length > 10).slice(0, 500);
}

export async function importRequirementsFile(
  fileName: string,
  fileBase64: string,
  mode: "append" | "replace" = "append"
): Promise<{ imported: number; skipped: number; total_rows: number; mode: string }> {
  const r = await fetch(URLS.importRequirements, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_name: fileName, file_data: fileBase64, mode }),
  });
  return r.json();
}