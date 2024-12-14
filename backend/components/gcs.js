const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

async function uploadToGcs(filePath) {
  const bucketName = 'your-bucket';
  const bucket = storage.bucket(bucketName);
  const blob = bucket.file(filePath);
  await bucket.upload(filePath);
  return blob.publicUrl();
}

module.exports = { uploadToGcs };
