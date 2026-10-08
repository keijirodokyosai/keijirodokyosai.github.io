/**
 * 組織共済 WEB 受付 — Cloudflare Worker（Graph → OneDrive）
 * 仕様: docs/soshiki-form-submit-worker-graph.md
 */

const ALLOWED_ORIGIN = "https://keijirodokyosai.github.io";
const MAX_BODY_BYTES = 2 * 1024 * 1024;

export default {
  async fetch(request, env) {
    const corsHeaders = corsHeadersFor(request);

    if (request.method === "OPTIONS") {
      if (!corsHeaders) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return jsonResponse(
        { ok: false, message: "Method not allowed" },
        405,
        corsHeaders
      );
    }

    if (!corsHeaders) {
      return jsonResponse(
        { ok: false, message: "Origin not allowed" },
        403,
        null
      );
    }

    const configError = validateEnv(env);
    if (configError) {
      console.error(configError);
      return jsonResponse(
        { ok: false, message: "Server configuration error" },
        500,
        corsHeaders
      );
    }

    let bodyText;
    try {
      bodyText = await readBodyWithLimit(request, MAX_BODY_BYTES);
    } catch (error) {
      const message =
        error && error.message === "BODY_TOO_LARGE"
          ? "Request body too large"
          : "Invalid request body";
      return jsonResponse({ ok: false, message }, 413, corsHeaders);
    }

    let payload;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return jsonResponse(
        { ok: false, message: "Invalid JSON" },
        400,
        corsHeaders
      );
    }

    const password = payload.password;
    if (!passwordMatches(String(password), env.SOSHIKI_SUBMIT_PASSWORD)) {
      return jsonResponse(
        { ok: false, message: "パスワードが正しくありません。" },
        401,
        corsHeaders
      );
    }

    const unionName = String(payload.unionName || "").trim();
    const fileNameDate = String(payload.fileNameDate || "").trim();
    const submission = payload.submission;

    if (!unionName || !fileNameDate || !submission) {
      return jsonResponse(
        { ok: false, message: "Missing required fields" },
        400,
        corsHeaders
      );
    }

    if (payload.pdfBase64 != null && String(payload.pdfBase64).trim()) {
      return jsonResponse(
        {
          ok: false,
          message:
            "この受付口は JSON のみです。ブラウザを再読み込みしてから再度お試しください。",
        },
        400,
        corsHeaders
      );
    }

    const storageFolder = String(
      submission.StorageFolder || submission.storageFolder || ""
    ).trim();
    if (!storageFolder) {
      return jsonResponse(
        { ok: false, message: "submission.StorageFolder is required" },
        400,
        corsHeaders
      );
    }

    const receiptId = generateReceiptId();
    const fileStem = `${sanitizeFileNameSegment(unionName)}_${fileNameDate}_${receiptId}`;
    const jsonFileName = `${fileStem}.json`;
    const basePath = env.GRAPH_BASE_PATH.trim();

    const jsonPath = [
      basePath,
      "受付",
      storageFolder,
      "json",
      jsonFileName,
    ];

    const jsonContent = JSON.stringify(submission, null, 2);

    try {
      const token = await fetchGraphToken(env);
      await uploadDriveFile(
        env.GRAPH_DRIVE_USER_ID,
        token,
        jsonPath,
        jsonContent,
        "application/json; charset=utf-8"
      );
    } catch (error) {
      console.error("Graph upload failed:", error);
      return jsonResponse(
        {
          ok: false,
          message:
            "保存に失敗しました。時間をおいて再度お試しください。",
        },
        502,
        corsHeaders
      );
    }

    return jsonResponse({ ok: true, receiptId }, 200, corsHeaders);
  },
};

function corsHeadersFor(request) {
  const origin = request.headers.get("Origin");
  if (origin !== ALLOWED_ORIGIN) {
    return null;
  }
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(data, status, corsHeaders) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
  };
  if (corsHeaders) {
    Object.assign(headers, corsHeaders);
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function validateEnv(env) {
  const required = [
    "AZURE_TENANT_ID",
    "AZURE_CLIENT_ID",
    "AZURE_CLIENT_SECRET",
    "GRAPH_DRIVE_USER_ID",
    "GRAPH_BASE_PATH",
    "SOSHIKI_SUBMIT_PASSWORD",
  ];
  for (const key of required) {
    if (!env[key] || !String(env[key]).trim()) {
      return `Missing secret: ${key}`;
    }
  }
  return null;
}

async function readBodyWithLimit(request, maxBytes) {
  const contentLength = request.headers.get("Content-Length");
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new Error("BODY_TOO_LARGE");
  }
  const reader = request.body && request.body.getReader();
  if (!reader) {
    return "";
  }
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      throw new Error("BODY_TOO_LARGE");
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

function passwordMatches(input, expected) {
  const a = String(input);
  const b = String(expected);
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function generateReceiptId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

function sanitizeFileNameSegment(value) {
  return String(value).replace(/[\\/:*?"<>|]/g, "_").trim();
}

async function fetchGraphToken(env) {
  const body = new URLSearchParams({
    client_id: env.AZURE_CLIENT_ID,
    client_secret: env.AZURE_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const response = await fetch(
    `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("Token response missing access_token");
  }
  return data.access_token;
}

async function uploadDriveFile(userId, token, pathSegments, body, contentType) {
  const encodedPath = pathSegments
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const url = `https://graph.microsoft.com/v1.0/users/${userId}/drive/root:/${encodedPath}:/content`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload ${pathSegments.join("/")}: ${response.status} ${text}`);
  }
}
