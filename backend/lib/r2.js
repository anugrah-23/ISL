// backend/lib/r2.js
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const R2_BUCKET = process.env.R2_BUCKET;
const R2_ENDPOINT = process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);

if (!R2_BUCKET || !process.env.R2_ACCESS_KEY || !process.env.R2_SECRET_KEY) {
  console.warn('[r2] Missing R2 env vars (R2_BUCKET/R2_ACCESS_KEY/R2_SECRET_KEY). R2 operations will fail until configured.');
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  forcePathStyle: false,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY || '',
    secretAccessKey: process.env.R2_SECRET_KEY || '',
  },
});

async function getPresignedGetUrl(Key, expiresSeconds = 60*60) {
  if (!Key) throw new Error('Key required');
  const cmd = new GetObjectCommand({ Bucket: R2_BUCKET, Key });
  return getSignedUrl(s3Client, cmd, { expiresIn: expiresSeconds });
}

async function getPresignedPutUrl(Key, expiresSeconds = 60, ContentType = 'video/mp4') {
  if (!Key) throw new Error('Key required');
  const cmd = new PutObjectCommand({ Bucket: R2_BUCKET, Key, ContentType });
  return getSignedUrl(s3Client, cmd, { expiresIn: expiresSeconds });
}

async function putObject({ Key, Body, ContentType = 'video/mp4' }) {
  if (!Key || !Body) throw new Error('Key and Body required');
  const cmd = new PutObjectCommand({ Bucket: R2_BUCKET, Key, Body, ContentType });
  return s3Client.send(cmd);
}

module.exports = { s3Client, getPresignedGetUrl, getPresignedPutUrl, putObject };
