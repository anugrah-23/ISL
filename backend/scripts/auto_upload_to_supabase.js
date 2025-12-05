// backend/scripts/auto_upload_to_supabase.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const os = require('os');
const getPool = require('../config/db');
const { createClient } = require('@supabase/supabase-js');

// Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const BUCKET = process.env.SUPABASE_BUCKET || 'isl-videos';

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/\.[^/.]+$/, '') // remove .mp4
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Fuzzy similarity (very simple)
function similarity(a, b) {
  let longer = a.length >= b.length ? a : b;
  let shorter = a.length < b.length ? a : b;

  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer[i] === shorter[i]) matches++;
  }
  return matches / longer.length;
}

async function ensureCourse(title = "Supabase Uploads") {
  const pool = getPool();
  const { rows } = await pool.query(
    "SELECT id FROM courses WHERE title = $1 LIMIT 1", 
    [title]
  );
  if (rows.length) return rows[0].id;

  const result = await pool.query(
    "INSERT INTO courses (title, description) VALUES ($1,$2) RETURNING id",
    [title, "Uploaded automatically"]
  );
  return result.rows[0].id;
}

async function loadLessonMap() {
  const pool = getPool();
  const { rows } = await pool.query("SELECT id, title FROM lessons");
  const map = {};

  rows.forEach(r => {
    const n = normalize(r.title);
    map[n] = r.id;
  });

  return map;
}

function findBestLesson(normalizedName, lessonMap) {
  // 1. exact match
  if (lessonMap[normalizedName]) return lessonMap[normalizedName];

  // 2. relaxed match (remove underscores)
  const cleaned = normalizedName.replace(/_/g, '');

  for (const key of Object.keys(lessonMap)) {
    if (key.replace(/_/g, '') === cleaned) return lessonMap[key];
  }

  // 3. fuzzy match (>= 85% similar)
  let best = null;
  let score = 0.0;

  for (const key of Object.keys(lessonMap)) {
    const s = similarity(normalizedName, key);
    if (s > score) {
      score = s;
      best = key;
    }
  }

  if (score >= 0.85) return lessonMap[best];
  return null;
}

async function main() {
  const uploadsDir = process.argv[2] || path.join(os.homedir(), "Downloads");

  if (!fs.existsSync(uploadsDir)) {
    console.error("Folder not found:", uploadsDir);
    process.exit(1);
  }

  const pool = getPool();
  const files = fs.readdirSync(uploadsDir).filter(f => f.toLowerCase().endsWith(".mp4"));

  if (!files.length) {
    console.log("No .mp4 files found in folder.");
    return;
  }

  const lessonMap = await loadLessonMap();
  const courseId = await ensureCourse();

  console.log("Lessons loaded:", Object.keys(lessonMap).length);
  console.log("Uploading", files.length, "files...\n");

  for (const file of files) {
    try {
      const filePath = path.join(uploadsDir, file);
      const buffer = fs.readFileSync(filePath);

      const normalizedName = normalize(file);
      console.log("Processing:", file, "→", normalizedName);

      let lessonId = findBestLesson(normalizedName, lessonMap);

      if (!lessonId) {
        console.log("❌ No matching lesson found. Creating new lesson.");
        const res = await pool.query(
          "INSERT INTO lessons (course_id, title) VALUES ($1,$2) RETURNING id",
          [courseId, file.replace(".mp4", "")]
        );
        lessonId = res.rows[0].id;
        lessonMap[normalizedName] = lessonId;
      } else {
        console.log("✔ Found matching lesson:", lessonId);
      }

      // Create Supabase key
      const storageKey = `videos/${Date.now()}-${file.replace(/\s+/g, "_")}`;

      // Upload to Supabase
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(storageKey, buffer, { contentType: "video/mp4" });

      if (uploadErr) {
        console.error("Upload failed:", uploadErr);
        continue;
      }

      console.log("✔ Uploaded to storage:", storageKey);

      // Insert DB row
      const stat = fs.statSync(filePath);
      await pool.query(
        "INSERT INTO videos (lesson_id, s3_key, content_type, size_bytes, status) VALUES ($1,$2,$3,$4,$5)",
        [lessonId, storageKey, "video/mp4", stat.size, "uploaded"]
      );

      console.log("✔ DB updated for lesson:", lessonId, "\n");

    } catch (err) {
      console.error("❌ Error:", err);
    }
  }

  console.log("All files processed.");
  process.exit(0);
}

main();
