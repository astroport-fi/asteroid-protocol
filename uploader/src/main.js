import "dotenv/config";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

async function generateUploadURL(s3Client, folder, fileName, fileType) {
  const command = new PutObjectCommand({
    Key: `${folder}/${fileName}`,
    ContentType: fileType,
    Bucket: process.env.S3_BUCKET,
    Metadata: { "Content-Type": fileType },
    ACL: "public-read",
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  endpoint: process.env.S3_ENDPOINT,
});

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("hello world");
});

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`);
});

app.post("/inscription/upload", async (req, res) => {
  const { launchHash, contentType } = req.body;

  const inscriptionSignedUrl = await generateUploadURL(
    s3Client,
    launchHash,
    "1.jpg", // @todo
    contentType
  );
  const metadataSignedUrl = await generateUploadURL(
    s3Client,
    launchHash,
    "1_metadata.json",
    "application/json"
  );

  res.json({ inscriptionSignedUrl, metadataSignedUrl });
});
