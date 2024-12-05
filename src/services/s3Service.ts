const AWS = require('aws-sdk');
import prisma from '../prisma';

// Initialize AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Use environment variables for better security
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION, // e.g., 'us-west-2'
});

// Upload file to S3
export const uploadToS3 = async (fileBuffer: any, fileName: any, bucketName: any) => {
  const params = {
    Bucket: bucketName,
    Key: fileName, // The file will be stored with this name
    Body: fileBuffer, // The buffer from multer
    ContentType: 'application/octet-stream',
  };

  try {
    const uploadResult = await s3.upload(params).promise();
    return uploadResult.Location; // Return the URL of the uploaded file
  } catch (err) {
    console.error('Error uploading file:', err);
    throw err;
  }
};

export const storeFileLinkInDb = async (fileName: any, fileUrl: any) => {

  const url = process.env.CLOUDFRONT_URL;

  try {
    const file = await prisma.file.create({
      data: {
        fileName,
        fileUrl: `${url}/${fileName}`, // CloudFront URL/fileName,
      },
    });
    return file;
  } catch (err) {
    console.error('Error storing file link in DB:', err);
    throw err;
  }
};

export const storeCSVLinkInDb = async (csvName: string, table_name: string) => {

  const url = process.env.CLOUDFRONT_URL;

  try {
    const file = await prisma.cSV.create({
      data: {
        csvName,
        csvUrl: `${url}/${csvName}`,
        csvExternalTableName: table_name
      },
    });
    return file;
  } catch (err) {
    console.error('Error storing CSV link in DB:', err);
    throw err;
  }
};

export default s3;
