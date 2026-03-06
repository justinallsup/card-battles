import { S3Client, CreateBucketCommand, PutBucketPolicyCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

export async function initStorage(): Promise<void> {
  const bucket = process.env.S3_BUCKET;
  if (!bucket || !process.env.S3_ENDPOINT) return;

  const s3 = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });

  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`[Storage] Bucket "${bucket}" ready`);
  } catch {
    try {
      await s3.send(new CreateBucketCommand({ Bucket: bucket }));
      await s3.send(new PutBucketPolicyCommand({
        Bucket: bucket,
        Policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{ Sid: 'PublicRead', Effect: 'Allow', Principal: '*', Action: ['s3:GetObject'], Resource: [`arn:aws:s3:::${bucket}/*`] }],
        }),
      }));
      console.log(`[Storage] Bucket "${bucket}" created`);
    } catch (err) {
      console.warn('[Storage] Bucket init skipped:', (err as Error).message);
    }
  }
}
