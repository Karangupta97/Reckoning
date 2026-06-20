import { PrismaClient } from "@prisma/client";
import { getFileBuffer } from "./services/s3.service.js";
import { runReckoningDetection } from "./modules/ai/ai.service.js";

const prisma = new PrismaClient();

async function main() {
  const fileId = "cmqm1owwv000fwp8rrf07nwyv";
  const userId = "cmpzouoyq00018b82vcs5cgpy";
  
  console.log('1. Querying Prisma for file:', fileId);
  const file = await prisma.mediaUpload.findUnique({ where: { id: fileId } });
  if (!file) {
    throw new Error('File not found in database.');
  }
  
  console.log('2. Fetching buffer from S3 for key:', file.s3Key);
  try {
    const buffer = await getFileBuffer(file.s3Key);
    console.log('Successfully retrieved buffer from S3. Size:', buffer.length, 'bytes');

    console.log('3. Running YOLO detection...');
    const result = await runReckoningDetection(buffer, file.mimeType, userId);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error occurred in getFileBuffer or runReckoningDetection:', error);
  }
}

main().catch(console.error);
