// frontend/src/components/resolveSentenceVideos.js
// Sentence → word → Cloudflare R2 video resolver
// Missing words are silently skipped

const R2_BASE = process.env.REACT_APP_R2_BASE_URL;

// Folder search order (as per your R2 structure)
const R2_FOLDERS = [
  "First_R2",
  "Second_R2",
  "Third_R2",
  "Fourth_R2",
  "Animated",
];

// Normalize sentence word → filename-safe token
function normalizeWord(word) {
  return word
    .toLowerCase()
    .replace(/[^a-z]/g, ""); // keep only letters
}

// Check if a video exists in R2
async function videoExists(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

// Resolve ONE word → video URL (or null)
async function resolveWordVideo(word) {
  const clean = normalizeWord(word);
  if (!clean) return null;

  for (const folder of R2_FOLDERS) {
    const url = `${R2_BASE}/${folder}/Wan_ISL_${clean}.mp4`;
    if (await videoExists(url)) {
      return url;
    }
  }

  return null;
}

// MAIN API
export async function resolveSentenceVideos(sentence) {
  if (!sentence || typeof sentence !== "string") return [];

  const words = sentence.split(/\s+/);
  const videoUrls = [];

  for (const word of words) {
    const url = await resolveWordVideo(word);
    if (url) videoUrls.push(url);
  }

  return videoUrls; // may be empty — allowed
}
