import COS from "cos-nodejs-sdk-v5";
import path from "node:path";

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function createClient(): COS {
  const SecretId = process.env.COS_SECRET_ID;
  const SecretKey = process.env.COS_SECRET_KEY;

  if (!SecretId || !SecretKey) {
    throw new Error("COS_SECRET_ID and COS_SECRET_KEY must be configured in .env");
  }

  return new COS({ SecretId, SecretKey });
}

function validateFile(filePath: string, buffer: Buffer): void {
  const ext = path.extname(filePath).toLowerCase();

  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new Error(`不支持的文件格式: ${ext}，仅允许 ${ALLOWED_EXTENSIONS.join(", ")}`);
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`文件大小 ${(buffer.length / 1024 / 1024).toFixed(1)}MB 超过限制 10MB`);
  }
}

export async function uploadImage(buffer: Buffer, filePath: string): Promise<string> {
  validateFile(filePath, buffer);

  const Bucket = process.env.COS_BUCKET;
  const Region = process.env.COS_REGION;

  if (!Bucket || !Region) {
    throw new Error("COS_BUCKET and COS_REGION must be configured in .env");
  }

  const cos = createClient();

  const result = await cos.putObject({
    Bucket,
    Region,
    Key: filePath,
    Body: buffer,
  });

  if (result.statusCode !== 200) {
    throw new Error(`COS 上传失败: HTTP ${result.statusCode}`);
  }

  return `https://${Bucket}.cos.${Region}.myqcloud.com/${filePath}`;
}
