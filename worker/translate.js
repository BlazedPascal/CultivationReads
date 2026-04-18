import 'dotenv/config';

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:14b';
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '30000');

const SYSTEM_PROMPT =
  'You are a professional Chinese to English light novel translator. ' +
  'Translate naturally and fluently, preserving cultivation terms, names, and the author\'s tone. ' +
  'Do not add commentary.';

async function fetchNext() {
  const res = await fetch(`${API_BASE}/queue/next`);
  if (!res.ok) throw new Error(`Queue fetch failed: ${res.status}`);
  const { item } = await res.json();
  return item;
}

async function translate(rawText) {
  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      system: SYSTEM_PROMPT,
      prompt: rawText,
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return data.response?.trim();
}

async function postChapter(novelSlug, chapterNumber, contentEn, contentRaw) {
  const res = await fetch(`${API_BASE}/chapters/${novelSlug}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chapter_number: chapterNumber,
      content_en: contentEn,
      content_raw: contentRaw,
    }),
  });
  if (!res.ok) throw new Error(`Chapter post failed: ${res.status}`);
  return res.json();
}

async function markQueue(id, status, errorMessage) {
  await fetch(`${API_BASE}/queue/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, error_message: errorMessage }),
  });
}

async function processOne() {
  let item;
  try {
    item = await fetchNext();
  } catch (err) {
    console.error('[worker] Failed to fetch queue:', err.message);
    return false;
  }

  if (!item) return false;

  console.log(`[worker] Translating queue item ${item.id}: ${item.novel_slug} ch${item.chapter_number}`);

  try {
    const translated = await translate(item.raw_text);
    if (!translated) throw new Error('Empty translation response');

    await postChapter(item.novel_slug, item.chapter_number, translated, item.raw_text);
    await markQueue(item.id, 'done', null);
    console.log(`[worker] Done: ${item.novel_slug} ch${item.chapter_number}`);
    return true;
  } catch (err) {
    console.error(`[worker] Failed item ${item.id}:`, err.message);
    await markQueue(item.id, 'failed', err.message).catch(() => {});
    return false;
  }
}

async function runLoop() {
  console.log(`[worker] Starting. Polling every ${POLL_INTERVAL_MS / 1000}s. Model: ${OLLAMA_MODEL}`);

  while (true) {
    let didWork = true;
    // Drain queue before sleeping
    while (didWork) {
      didWork = await processOne();
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

runLoop().catch((err) => {
  console.error('[worker] Fatal:', err);
  process.exit(1);
});
