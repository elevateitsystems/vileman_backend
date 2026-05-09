import webp from "webp-converter";
import path from "path";
import fs from "fs";
import { promises as fsPromises } from "fs";
import { config } from "@/core/config";
import { AppLogger } from "@/core/logging/logger";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Formats a string into a URL-friendly public ID
 */
const formatFileName = (name: string) => {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .toLowerCase();
};

/**
 * Converts an image to WebP and saves it locally
 */
export const uploadToLocal = async (
  imageName: string,
  tempPath: string,
  subFolder: string = "general"
): Promise<{ url: string; publicId: string }> => {
  try {
    const folderPath = path.join(uploadDir, subFolder);

    // Ensure subfolder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const fileName = `${formatFileName(imageName)}-${Date.now()}.webp`;
    const outputPath = path.join(folderPath, fileName);

    AppLogger.debug(`Converting image to WebP: ${tempPath} -> ${outputPath}`);

    // Convert to webp
    // Note: webp-converter's cwebp method returns a promise in newer versions
    await webp.cwebp(tempPath, outputPath, "-q 80");

    // Delete the original temporary file
    try {
      await fsPromises.unlink(tempPath);
    } catch (e) {
      AppLogger.warn(`Failed to delete temp file: ${tempPath}`);
    }

    // Construct the live URL
    const relativePath = `uploads/${subFolder}/${fileName}`;
    const liveUrl = `${config.server.baseUrl}/${relativePath}`;

    return {
      url: liveUrl,
      publicId: fileName, // Using filename as identifier for potential deletion
    };
  } catch (error) {
    AppLogger.error("Local WebP Upload Error:", error);
    throw new Error("Failed to process and store image locally");
  }
};

/**
 * Deletes a locally stored image
 */
export const deleteLocalFile = async (
  publicId: string,
  subFolder: string
): Promise<boolean> => {
  try {
    const filePath = path.join(uploadDir, subFolder, publicId);
    if (fs.existsSync(filePath)) {
      await fsPromises.unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    AppLogger.error(`Error deleting local file: ${publicId}`, error);
    return false;
  }
};
