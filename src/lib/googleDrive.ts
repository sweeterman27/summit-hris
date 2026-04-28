import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'];

async function getDriveClient() {
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: SCOPES,
  });

  return google.drive({ version: 'v3', auth });
}

async function getOrCreateSubfolder(drive: any, parentId: string, subfolderName: string) {
  try {
    const res = await drive.files.list({
      q: `name = '${subfolderName}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id)',
    });

    if (res.data.files && res.data.files.length > 0) {
      return res.data.files[0].id;
    }

    const folderMetadata = {
      name: subfolderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id',
    });

    return folder.data.id;
  } catch (err) {
    console.error('Error in getOrCreateSubfolder:', err);
    return parentId;
  }
}

export async function uploadToDrive(
  file: Buffer, 
  filename: string, 
  mimeType: string,
  subfolderName?: string
) {
  console.log(`[DRIVE] Starting upload: ${filename} (${mimeType})`);
  try {
    const drive = await getDriveClient();
    const mainFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!mainFolderId) {
      console.error('[DRIVE] GOOGLE_DRIVE_FOLDER_ID is missing from .env');
      throw new Error('GOOGLE_DRIVE_FOLDER_ID not set');
    }

    console.log(`[DRIVE] Main Folder ID: ${mainFolderId}`);

    let targetFolderId = mainFolderId;
    if (subfolderName) {
      console.log(`[DRIVE] Organizing into subfolder: ${subfolderName}`);
      targetFolderId = await getOrCreateSubfolder(drive, mainFolderId, subfolderName);
    }

    console.log(`[DRIVE] Target Folder ID: ${targetFolderId}`);

    // Convert Buffer to Stream
    const bufferStream = new Readable();
    bufferStream.push(file);
    bufferStream.push(null);

    console.log('[DRIVE] Sending request to Google API...');
    const response = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [targetFolderId],
      },
      media: {
        mimeType: mimeType,
        body: bufferStream,
      },
      fields: 'id, webViewLink, webContentLink',
    });

    const fileId = response.data.id;
    console.log(`[DRIVE] File created successfully! ID: ${fileId}`);

    // Make file public for viewing in the app
    console.log(`[DRIVE] Setting permissions for ${fileId}...`);
    await drive.permissions.create({
      fileId: fileId!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const directLink = `https://lh3.googleusercontent.com/d/${fileId}`;
    console.log(`[DRIVE] Public link generated: ${directLink}`);

    return {
      success: true,
      fileId,
      url: directLink
    };
  } catch (error: any) {
    console.error('[DRIVE] ERROR:', error.response?.data || error.message);
    throw error;
  }
}
