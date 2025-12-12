// frontend/src/services/media.js
import axios from 'axios';

/**
 * Request presigned PUT URL for a given key (server returns pre-signed).
 * key: string e.g. "videos/<filename>.mp4"
 */
export async function getPresignPut(key, contentType = 'video/mp4') {
  const res = await axios.get(`/api/videos/presign-put?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(contentType)}`);
  return res.data; // { url, key }
}

/**
 * Upload file (Blob/File) to R2 using presigned PUT url.
 * presign: { url, key }
 */
export async function uploadToR2(presign, file) {
  const res = await fetch(presign.url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'video/mp4' },
    body: file
  });
  if (!res.ok) throw new Error('Upload failed: ' + res.statusText);
  return presign.key;
}

/**
 * Get presigned GET url for stored video (server /api/videos/:id/presign returns URL)
 */
export async function getVideoPresign(videoId) {
  const res = await axios.get(`/api/videos/${videoId}/presign`);
  return res.data; // { url, key }
}
