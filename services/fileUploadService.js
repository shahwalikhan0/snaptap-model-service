require("dotenv").config(); //REMOVE before deployment
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");

// Helper function to get the full local path for a subfolder
function getLocalPath(subfolder) {
  const imagesDir = process.env.IMAGES_DIR_PATH;
  const modelsDir = process.env.MODELS_DIR_PATH;

  if (subfolder === "models") {
    return modelsDir;
  }
  
  // All other subfolders are under images directory
  return path.join(imagesDir, subfolder);
}

async function uploadFileToDO(localFilePath, subfolder, fileName) {
  try {
    const destinationDir = getLocalPath(subfolder);
    const destinationPath = path.join(destinationDir, fileName);

    // Ensure the destination directory exists
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    // Copy the file to the destination
    fs.copyFileSync(localFilePath, destinationPath);

    // Return the API URL for accessing the file
    let routeName = "image";
    if (subfolder === "models") {
      routeName = "model";
    }
    
    return `http://api.snaptap.pk/${routeName}/bucket/${subfolder}/${fileName}`;
  } catch (error) {
    console.error("Upload failed:", error);
    return null;
  }
}

async function getFileUrlFromDO(subfolder, fileName) {
  let routeName = "image";
  if (subfolder === "models") {
    routeName = "model";
  }
  return `http://api.snaptap.pk/${routeName}/bucket/${subfolder}/${fileName}`;
}

async function deleteFileFromDO(subfolder, fileName) {
  try {
    const filePath = path.join(getLocalPath(subfolder), fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    } else {
      console.warn(`File not found for deletion: ${filePath}`);
      return true; // Consider non-existent file as successfully "deleted"
    }
  } catch (error) {
    console.error("Delete failed:", error);
    throw new Error("Local file delete failed");
  }
}

async function updateFileInDO(localFilePath, subfolder, fileName) {
  try {
    const destinationDir = getLocalPath(subfolder);
    const destinationPath = path.join(destinationDir, fileName);

    // Ensure the destination directory exists
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    // Overwrite the existing file
    fs.copyFileSync(localFilePath, destinationPath);

    let routeName = "image";
    if (subfolder === "models") {
      routeName = "model";
    }
    
    return `http://api.snaptap.pk/${routeName}/bucket/${subfolder}/${fileName}`;
  } catch (error) {
    console.error("Update failed:", error);
    return null;
  }
}

async function getFileFromDO(subfolder, fileName) {
  try {
    const filePath = path.join(getLocalPath(subfolder), fileName);

    console.log("Getting file:", filePath);

    if (!fs.existsSync(filePath)) {
      console.error("File not found:", filePath);
      return null;
    }

    const stats = fs.statSync(filePath);
    const contentType = mime.lookup(fileName) || "application/octet-stream";

    return {
      bodyStream: fs.createReadStream(filePath),
      contentType: contentType,
      contentLength: stats.size,
    };
  } catch (error) {
    console.error("Error getting file from local storage:", error.message);
    return null;
  }
}

async function getSignedFileUrlFromDO(
  subfolder,
  fileName,
  expiresInSeconds = 300
) {
  // For local storage, we don't need signed URLs
  // Just return the regular URL
  console.log("Note: Signed URLs not needed for local storage, returning regular URL");
  return getFileUrlFromDO(subfolder, fileName);
}

module.exports = {
  uploadFileToDO,
  getFileUrlFromDO,
  deleteFileFromDO,
  updateFileInDO,
  getFileFromDO,
  getSignedFileUrlFromDO,
};
