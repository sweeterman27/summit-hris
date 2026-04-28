import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(
  file: Buffer,
  folder: string,
  filename?: string
) {
  console.log(`[CLOUDINARY] Attempting upload to: ${folder}/${filename}`);
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: filename?.split('.')[0], 
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('[CLOUDINARY] ERROR:', error);
          reject(error);
        } else {
          console.log(`[CLOUDINARY] SUCCESS! URL: ${result?.secure_url}`);
          resolve({
            success: true,
            url: result?.secure_url,
            publicId: result?.public_id,
          });
        }
      }
    );

    uploadStream.end(file);
  });
}

export default cloudinary;
