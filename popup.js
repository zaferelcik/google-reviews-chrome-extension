const state = { rows: [], placeName: "google-reviews" };

const $ = (id) => document.getElementById(id);
const statusEl = $("status");
const countEl = $("count");
const previewEl = $("preview");
const csvBtn = $("csvBtn");
const jsonBtn = $("jsonBtn");
const copyBtn = $("copyBtn");

function setStatus(message) {
  statusEl.textContent = message;
}

function setBusy(isBusy) {
  $("extractBtn").disabled = isBusy;
  $("scrollExtractBtn").disabled = isBusy;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab found.");
  return tab;
}

async function ensureContentScript(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "GRX_PING" });
  } catch (_) {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
  }
}

async function callContent(type, payload = {}) {
  const tab = await getActiveTab();
  if (!tab.url || !/https?:\/\/(www\.)?google\.|https?:\/\/maps\.google\./.test(tab.url) || !tab.url.includes("/maps")) {
    throw new Error("Open a Google Maps business listing with the Reviews panel first.");
  }
  await ensureContentScript(tab.id);
  return chrome.tabs.sendMessage(tab.id, { type, payload });
}

function updateRows(result) {
  state.rows = result?.reviews || [];
  state.placeName = result?.place?.name || "google-reviews";
  countEl.textContent = String(state.rows.length);
  const enabled = state.rows.length > 0;
  csvBtn.disabled = !enabled;
  jsonBtn.disabled = !enabled;
  copyBtn.disabled = !enabled;
  previewEl.textContent = enabled
    ? JSON.stringify(state.rows.slice(0, 3), null, 2)
    : "";
}

function csvEscape(value) {
  if (value === undefined || value === null) return "";
  const str = String(value).replace(/\r?\n|\r/g, " ").trim();
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCsv(rows) {
  const headers = [
    "place_name",
    "place_url",
    "review_id",
    "author_name",
    "author_link",
    "rating",
    "rating_label",
    "review_date",
    "review_text",
    "owner_answer",
    "likes",
    "review_image_urls"
  ];
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(","))
  ].join("\n");
}

function safeFilename(name, ext) {
  const base = (name || "google-reviews")
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u024f]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "google-reviews";
  const date = new Date().toISOString().slice(0, 10);
  return `${base}-${date}.${ext}`;
}

function downloadText(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$("extractBtn").addEventListener("click", async () => {
  setBusy(true);
  setStatus("Extracting visible reviews…");
  try {
    const result = await callContent("GRX_EXTRACT", {
      expand: $("expandReviews").checked
    });
    updateRows(result);
    setStatus(state.rows.length ? "Done. You can download CSV or JSON now." : "No reviews found. Make sure the Google Maps reviews panel is open and reviews are visible.");
  } catch (error) {
    setStatus(error.message || String(error));
  } finally {
    setBusy(false);
  }
});

$("scrollExtractBtn").addEventListener("click", async () => {
  setBusy(true);
  setStatus("Auto-scrolling reviews. Keep this Google Maps tab open…");
  try {
    const maxScrolls = Math.max(1, Math.min(300, Number($("maxScrolls").value) || 80));
    const delayMs = Math.max(250, Math.min(5000, Number($("delayMs").value) || 1200));
    const result = await callContent("GRX_SCROLL_EXTRACT", {
      expand: $("expandReviews").checked,
      maxScrolls,
      delayMs
    });
    updateRows(result);
    setStatus(state.rows.length ? `Done after ${result.scrolls_done || 0} scroll rounds.` : "No reviews found after scrolling. Open the reviews panel first.");
  } catch (error) {
    setStatus(error.message || String(error));
  } finally {
    setBusy(false);
  }
});

csvBtn.addEventListener("click", () => {
  downloadText(toCsv(state.rows), safeFilename(state.placeName, "csv"), "text/csv;charset=utf-8");
});

jsonBtn.addEventListener("click", () => {
  downloadText(JSON.stringify(state.rows, null, 2), safeFilename(state.placeName, "json"), "application/json;charset=utf-8");
});

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(toCsv(state.rows));
  setStatus("CSV copied to clipboard.");
});
