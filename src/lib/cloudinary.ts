import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file (Buffer or Base64) to Cloudinary
 * @param file The file data (Buffer or Base64 string)
 * @param folder The folder name in Cloudinary
 * @param publicId Optional specific public ID for the file
 * @returns The secure URL of the uploaded file
 */
export async function uploadToCloudinary(file: Buffer | string, folder: string, publicId?: string) {
  try {
    const fileToUpload = Buffer.isBuffer(file) 
      ? `data:image/jpeg;base64,${file.toString('base64')}` 
      : file;

    const options: any = {
      folder: `summit_hris/${folder}`,
      resource_type: 'auto',
    };

    if (publicId) {
      options.public_id = publicId;
    }

    const result = await cloudinary.uploader.upload(fileToUpload, options);

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw error;
  }
}

export default cloudinary;
