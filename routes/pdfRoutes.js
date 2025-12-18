const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * GET /api/pdf?url=DRIVE_URL
 */
router.get("/", async (req, res) => {
  try {
    const driveUrl = req.query.url;

    if (!driveUrl) {
      return res.status(400).json({ message: "Missing Drive URL" });
    }

    // Extract file ID from Drive URL
    const match = driveUrl.match(/\/d\/([^/]+)/);
    if (!match) {
      return res.status(400).json({ message: "Invalid Google Drive URL" });
    }

    const fileId = match[1];

    // Google Drive direct download URL
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    const response = await axios.get(downloadUrl, {
      responseType: "stream",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    res.setHeader("Content-Type", "application/pdf");

    response.data.pipe(res);
  } catch (error) {
    console.error("PDF Proxy Error:", error.message);
    res.status(500).json({ message: "Failed to load PDF" });
  }
});

module.exports = router;
