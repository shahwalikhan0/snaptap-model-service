require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const { uploadFileToDO } = require("./services/fileUploadService"); // Assuming this is copied

const app = express();
const port = process.env.PORT || 3002;

const upload = multer({ dest: "uploads/" });
const outputDir = "converted";

// Ensure directories exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

app.post("/convert", upload.single("modelFile"), async (req, res) => {
  const modelFile = req.file;
  const desiredFilename = req.body.filename; // Should be passed by caller (e.g. product ID)

  if (!modelFile) {
    return res.status(400).json({ error: "No modelFile provided" });
  }

  const usdzPath = modelFile.path;
  // If no desired filename provided, use random temp name logic
  const baseName = desiredFilename || path.basename(usdzPath, path.extname(usdzPath)); 
  const glbPath = path.join(outputDir, `${baseName}.glb`);

  console.log(`Converting ${usdzPath} to ${glbPath}...`);

  try {
    // 1. Convert
    const blenderCommand = `blender --background --python scripts/convert_usdz_to_glb.py -- "${usdzPath}" "${glbPath}"`;

    await new Promise((resolve, reject) => {
      exec(blenderCommand, (error, stdout, stderr) => {
        if (error) {
          console.error("Blender stderr:", stderr);
          return reject(new Error(`Conversion failed: ${stderr || error.message}`));
        }
        if (!fs.existsSync(glbPath)) {
          return reject(new Error("GLB file was not created by Blender"));
        }
        resolve();
      });
    });

    // 2. Upload to DO Spaces
    // Note: uploadFileToDO logic typically returns a URL.
    // It accepts (localPath, subfolder, fileName)
    const BUCKET_SUBFOLDER = "models";
    const finalGlbName = `${baseName}.glb`;
    
    console.log(`Uploading ${glbPath} to ${BUCKET_SUBFOLDER}/${finalGlbName}...`);
    
    const glbUrl = await uploadFileToDO(glbPath, BUCKET_SUBFOLDER, finalGlbName);

    if (!glbUrl) {
      throw new Error("Failed to upload GLB to DigitalOcean Spaces");
    }

    // 3. Cleanup local files
    try {
      fs.unlinkSync(usdzPath);
      fs.unlinkSync(glbPath);
    } catch (cleanupErr) {
      console.warn("Cleanup warning:", cleanupErr.message);
    }

    // 4. Return URL
    res.json({ glbUrl });

  } catch (err) {
    console.error("Model service error:", err);
    // Try cleanup
    if (fs.existsSync(usdzPath)) fs.unlinkSync(usdzPath);
    if (fs.existsSync(glbPath)) fs.unlinkSync(glbPath);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Model Conversion Service listening on port ${port}`);
});
