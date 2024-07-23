import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Config } from './config.js'

export function generateUploadURL(
  s3Client: S3Client,
  bucket: string,
  folder: string,
  fileName: string,
  fileType: string,
) {
  const command = new PutObjectCommand({
    Key: `${folder}/${fileName}`,
    ContentType: fileType,
    Bucket: bucket,
    Metadata: { 'Content-Type': fileType },
    ACL: 'public-read',
  })
  return getSignedUrl(s3Client, command, { expiresIn: 3600 })
}

export function createS3Client(config: Config) {
  return new S3Client({
    region: config.AWS_REGION,
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
    endpoint: `https://${config.S3_ENDPOINT}`,
  })
}
