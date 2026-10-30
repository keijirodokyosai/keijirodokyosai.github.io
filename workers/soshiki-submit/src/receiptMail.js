/**
 * Receipt confirmation mail via Graph sendMail (parity with SoshikiFormReceiptMail.ps1).
 */

import { parseDriveJsonText } from "./graphDrive.js";

const SETTINGS_FOLDER = "\u8A2D\u5B9A";
const SETTINGS_FILE = "soshiki-form-office-settings.json";
const CONTACTS_FILE = "union-contacts.json";

const LABELS = {
  unionDefault: "\u7D44\u5408",
  managerDefault: "\u62C5\u5F53\u8005",
  sama: "\u69D8",
  subjectPrefix:
    "\u7D44\u7E54\u5171\u6E08WEB\u53D7\u4ED8_",
  lineReceived:
    "\u7D44\u7E54\u5171\u6E08\u306E WEB \u7533\u8FBC\u3092\u53D7\u3051\u4ED8\u3051\u307E\u3057\u305F\u3002",
  labelReceiptId: "\u53D7\u4ED8 ID:",
  labelKyosaiName: "\u5171\u6E08\u4F1A:",
  labelAppDate: "\u7533\u8FBC\u65E5:",
  footerSignLine1: "\u4EAC\u6ECB\u52B4\u50CD\u7D44\u5408\u5171\u6E08\u4F1A",
  footerSignLine2: "\u4E8B\u52D9\u5C40",
  adminSubjectPrefix: "\u7D44\u7E54\u5171\u6E08WEB\u7533\u8FBC_\u30A8\u30E9\u30FC_",
  adminHeadlineReceiptMail:
    "\u7D44\u7E54\u5171\u6E08\u53D7\u4ED8\u78BA\u8A3C\u30E1\u30FC\u30EB\u306E\u9001\u4FE1\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002",
  adminNoteJsonSaved:
    "\uFF08OneDrive \u306B json \u306F\u4FDD\u5B58\u6E08\u307F\u3067\u3059\u3002\u4E8B\u52D9 PDF \u306F\u5225\u7D4C\u8DEF\u3067\u4F5C\u6210\u3055\u308C\u307E\u3059\u3002\uFF09",
  labelStage: "\u51E6\u7406:",
  labelUnion: "\u7D44\u5408:",
  labelKyosaiCode: "\u5354\u540C\u30B3\u30FC\u30C9:",
  labelError: "\u30A8\u30E9\u30FC:",
};

export function parseUnionFileSegment(fileStem) {
  const parts = String(fileStem).split("_");
  if (parts.length < 3) {
    return { unionSegment: null, fileNameDate: null, receiptId: null };
  }
  const receiptId = parts[parts.length - 1];
  const fileNameDate = parts[parts.length - 2];
  const unionSegment = parts.slice(0, parts.length - 2).join("_");
  return { unionSegment, fileNameDate, receiptId };
}

function settingsPathSegments(basePath) {
  return [basePath.trim(), SETTINGS_FOLDER, SETTINGS_FILE];
}

function contactsPathSegments(basePath) {
  return [basePath.trim(), SETTINGS_FOLDER, CONTACTS_FILE];
}

export async function loadOfficeSettings(userId, token, basePath, downloadDriveFile) {
  const raw = await downloadDriveFile(
    userId,
    token,
    settingsPathSegments(basePath)
  );
  const data = parseDriveJsonText(raw);
  const adminEmail = String(data.AdminEmail || "").trim();
  const fromEmail = String(data.FromEmail || "").trim();
  if (!fromEmail) {
    throw new Error("FromEmail missing in office settings");
  }
  return { adminEmail, fromEmail };
}

export function parseContactsList(rawJson) {
  if (Array.isArray(rawJson)) {
    return rawJson;
  }
  if (rawJson && Array.isArray(rawJson.contacts)) {
    return rawJson.contacts;
  }
  return [];
}

export async function loadUnionContact(
  userId,
  token,
  basePath,
  kyosaikaiCode,
  downloadDriveFile
) {
  const raw = await downloadDriveFile(
    userId,
    token,
    contactsPathSegments(basePath)
  );
  const list = parseContactsList(parseDriveJsonText(raw));
  const code = String(kyosaikaiCode || "").trim();
  return list.find((c) => String(c.KyosaikaiCode || "").trim() === code) || null;
}

export function buildReceiptMailDraft({
  submission,
  unionName,
  fileNameDate,
  receiptId,
  contact,
  fromEmail,
}) {
  const parsed = parseUnionFileSegment(
    `${sanitizeFileNameSegment(unionName)}_${fileNameDate}_${receiptId}`
  );
  const unionSegment = parsed.unionSegment || unionName || LABELS.unionDefault;

  let managerName = LABELS.managerDefault;
  let to = null;
  if (contact) {
    if (contact.ManagerFamilyName) {
      managerName = String(contact.ManagerFamilyName).trim();
    }
    to = String(contact.ManagerEmail || "").trim() || null;
  }

  const appDate = submission.ApplicationDate || {};
  const appDateText = appDate.Year
    ? `${appDate.Year}/${appDate.Month}/${appDate.Day}`
    : "";

  const dateForSubject = fileNameDate || new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const subject = `${LABELS.subjectPrefix}${dateForSubject}`;
  const body = [
    `${managerName} ${LABELS.sama}`,
    "",
    LABELS.lineReceived,
    "",
    `${LABELS.labelReceiptId} ${receiptId}`,
    `${LABELS.labelKyosaiName} ${unionSegment}`,
    `${LABELS.labelAppDate} ${appDateText}`,
    "",
    LABELS.footerSignLine1,
    LABELS.footerSignLine2,
  ].join("\r\n");

  return { to, fromEmail, bcc: fromEmail, subject, body };
}

function sanitizeFileNameSegment(value) {
  return String(value).replace(/[\\/:*?"<>|]/g, "_").trim();
}

export async function sendGraphMail(mailUserId, token, { to, bcc, subject, body }) {
  const message = {
    subject,
    body: { contentType: "Text", content: body },
    toRecipients: [{ emailAddress: { address: to } }],
  };
  if (bcc) {
    message.bccRecipients = [{ emailAddress: { address: bcc } }];
  }

  const url = `https://graph.microsoft.com/v1.0/users/${mailUserId}/sendMail`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, saveToSentItems: true }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`sendMail: ${response.status} ${text}`);
  }
}

export function buildAdminAlertDraft({
  failureStage,
  errorMessage,
  receiptId,
  unionName,
  fileNameDate,
  submission,
  adminEmail,
  fromEmail,
}) {
  const parsed = parseUnionFileSegment(
    `${sanitizeFileNameSegment(unionName)}_${fileNameDate}_${receiptId}`
  );
  const unionSegment = parsed.unionSegment || unionName || LABELS.unionDefault;
  const dateForSubject =
    fileNameDate || new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const appDate = submission.ApplicationDate || {};
  const appDateText = appDate.Year
    ? `${appDate.Year}/${appDate.Month}/${appDate.Day}`
    : "";
  const code = String(submission.KyosaikaiCode || "");

  const headline =
    failureStage === "ReceiptMail"
      ? LABELS.adminHeadlineReceiptMail
      : LABELS.adminHeadlineReceiptMail;

  const subject = `${LABELS.adminSubjectPrefix}${failureStage}_${unionSegment}_${dateForSubject}`;
  const body = [
    headline,
    LABELS.adminNoteJsonSaved,
    "",
    `${LABELS.labelStage} ${failureStage}`,
    `${LABELS.labelReceiptId} ${receiptId}`,
    `${LABELS.labelUnion} ${unionSegment}`,
    `${LABELS.labelAppDate} ${appDateText}`,
    `${LABELS.labelKyosaiCode} ${code}`,
    "",
    LABELS.labelError,
    errorMessage,
  ].join("\r\n");

  return { to: adminEmail, fromEmail, subject, body };
}

/**
 * @returns {{ mailSent: boolean, mailError?: string }}
 */
export async function sendReceiptMailAfterUpload(env, ctx) {
  if (String(env.SOSHIKI_SKIP_RECEIPT_MAIL || "").trim() === "1") {
    return { mailSent: false, mailError: "skipped" };
  }

  const {
    token,
    userId,
    basePath,
    submission,
    unionName,
    fileNameDate,
    receiptId,
    downloadDriveFile,
  } = ctx;

  const code = String(submission.KyosaikaiCode || "").trim();
  if (!code) {
    return { mailSent: false, mailError: "submission.KyosaikaiCode missing" };
  }

  let settings;
  try {
    settings = await loadOfficeSettings(userId, token, basePath, downloadDriveFile);
  } catch (error) {
    await tryAdminAlert(env, ctx, settings, error.message, "ReceiptMail");
    return { mailSent: false, mailError: error.message };
  }

  let contact;
  try {
    contact = await loadUnionContact(
      userId,
      token,
      basePath,
      code,
      downloadDriveFile
    );
  } catch (error) {
    await tryAdminAlert(env, ctx, settings, error.message, "ReceiptMail");
    return { mailSent: false, mailError: error.message };
  }

  const draft = buildReceiptMailDraft({
    submission,
    unionName,
    fileNameDate,
    receiptId,
    contact,
    fromEmail: settings.fromEmail,
  });

  if (!draft.to) {
    const msg = `No ManagerEmail for KyosaikaiCode=${code}`;
    await tryAdminAlert(env, ctx, settings, msg, "ReceiptMail");
    return { mailSent: false, mailError: msg };
  }

  const mailUserId = String(env.GRAPH_MAIL_USER_ID || env.GRAPH_DRIVE_USER_ID).trim();
  try {
    await sendGraphMail(mailUserId, token, draft);
    return { mailSent: true };
  } catch (error) {
    const msg = error.message || String(error);
    console.error("Receipt mail failed:", msg);
    await tryAdminAlert(env, ctx, settings, msg, "ReceiptMail");
    return { mailSent: false, mailError: msg };
  }
}

async function tryAdminAlert(env, ctx, settings, errorMessage, failureStage) {
  try {
    if (!settings) {
      settings = await loadOfficeSettings(
        ctx.userId,
        ctx.token,
        ctx.basePath,
        ctx.downloadDriveFile
      );
    }
    const adminEmail = settings.adminEmail;
    if (!adminEmail) {
      console.error("Admin alert skipped: AdminEmail missing");
      return;
    }
    const draft = buildAdminAlertDraft({
      failureStage,
      errorMessage,
      receiptId: ctx.receiptId,
      unionName: ctx.unionName,
      fileNameDate: ctx.fileNameDate,
      submission: ctx.submission,
      adminEmail,
      fromEmail: settings.fromEmail,
    });
    const mailUserId = String(env.GRAPH_MAIL_USER_ID || env.GRAPH_DRIVE_USER_ID).trim();
    await sendGraphMail(mailUserId, ctx.token, {
      to: draft.to,
      bcc: null,
      subject: draft.subject,
      body: draft.body,
    });
  } catch (alertError) {
    console.error("Admin alert failed:", alertError);
  }
}
