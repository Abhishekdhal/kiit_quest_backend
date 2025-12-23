const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * GET /api/pdf?url=DRIVE_URL
 * Enhanced to handle encoded URLs and robust ID extraction
 */
router.get("/", async (req, res) => {
  try {
    let driveUrl = req.query.url;

    if (!driveUrl) {
      console.error("PDF Proxy: Missing Drive URL");
      return res.status(400).json({ message: "Missing Drive URL" });
    }

    // ✅ FIX: Decode the URL first. 
    // This turns encoded characters like %2F back into / so the regex works.
    driveUrl = decodeURIComponent(driveUrl);

    // Extract file ID from various Google Drive URL formats
    let fileId = null;
    
    // ✅ FIX: Improved regex to capture alphanumeric IDs including hyphens and underscores
    // This ignores trailing parameters like /view?usp=sharing
    const dMatch = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (dMatch) {
      fileId = dMatch[1];
    } else {
      const idMatch = driveUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch) {
        fileId = idMatch[1];
      }
    }

    if (!fileId) {
      console.error("PDF Proxy: Invalid Google Drive URL format:", driveUrl);
      return res.status(400).json({ 
        message: "Invalid Google Drive URL format",
        receivedUrl: driveUrl 
      });
    }

    console.log(`PDF Proxy: Successfully extracted file ID: ${fileId}`);

    // Google Drive direct download URL
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    const response = await axios.get(downloadUrl, {
      responseType: "stream",
      maxRedirects: 5,
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      },
    });

    if (response.status !== 200) {
      console.error(`PDF Proxy: Google Drive returned status ${response.status} for file ${fileId}`);
      return res.status(response.status).json({ 
        message: "Failed to fetch from Google Drive",
        status: response.status,
        fileId: fileId
      });
    }

    // Set proper headers for PDF viewing
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Cache-Control", "public, max-age=3600");
    
    if (response.headers['content-length']) {
      res.setHeader("Content-Length", response.headers['content-length']);
    }

    // Pipe the stream to the response
    response.data.pipe(res);

    response.data.on('error', (error) => {
      console.error("PDF Proxy: Stream error:", error.message);
      if (!res.headersSent) {
        res.status(500).json({ message: "Stream error occurred" });
      }
    });

  } catch (error) {
    console.error("PDF Proxy Error:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ 
        message: "Failed to load PDF",
        error: error.message,
      });
    }
  }
});

module.exports = router;

// const express = require("express");
// const axios = require("axios");

// const router = express.Router();

// /**
//  * GET /api/pdf?url=DRIVE_URL
//  * Enhanced with better error handling and logging
//  */
// router.get("/", async (req, res) => {
//   try {
//     const driveUrl = req.query.url;

//     if (!driveUrl) {
//       console.error("PDF Proxy: Missing Drive URL");
//       return res.status(400).json({ message: "Missing Drive URL" });
//     }

//     // Extract file ID from various Google Drive URL formats
//     let fileId = null;
    
//     // Format 1: /d/FILE_ID/view
//     let match = driveUrl.match(/\/d\/([^/?]+)/);
//     if (match) {
//       fileId = match[1];
//     } else {
//       // Format 2: ?id=FILE_ID
//       match = driveUrl.match(/[?&]id=([^&]+)/);
//       if (match) {
//         fileId = match[1];
//       }
//     }

//     if (!fileId) {
//       console.error("PDF Proxy: Invalid Google Drive URL format:", driveUrl);
//       return res.status(400).json({ 
//         message: "Invalid Google Drive URL format",
//         receivedUrl: driveUrl 
//       });
//     }

//     console.log(`PDF Proxy: Fetching file ID: ${fileId}`);

//     // Google Drive direct download URL
//     const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

//     const response = await axios.get(downloadUrl, {
//       responseType: "stream",
//       maxRedirects: 5,
//       timeout: 30000, // 30 second timeout
//       headers: {
//         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
//       },
//       validateStatus: function (status) {
//         return status >= 200 && status < 500; // Don't throw on 4xx errors
//       },
//     });

//     // Check if Google Drive returned an error
//     if (response.status !== 200) {
//       console.error(`PDF Proxy: Google Drive returned status ${response.status} for file ${fileId}`);
//       return res.status(response.status).json({ 
//         message: "Failed to fetch from Google Drive",
//         status: response.status,
//         fileId: fileId
//       });
//     }

//     // Check content type
//     const contentType = response.headers['content-type'];
//     if (contentType && !contentType.includes('application/pdf') && !contentType.includes('octet-stream')) {
//       console.warn(`PDF Proxy: Unexpected content type: ${contentType} for file ${fileId}`);
//       // Continue anyway as Drive sometimes returns wrong content-type
//     }

//     console.log(`PDF Proxy: Successfully streaming file ${fileId}`);

//     // Set proper headers
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    
//     // If content-length is available, pass it along
//     if (response.headers['content-length']) {
//       res.setHeader("Content-Length", response.headers['content-length']);
//     }

//     // Pipe the response
//     response.data.pipe(res);

//     // Handle stream errors
//     response.data.on('error', (error) => {
//       console.error("PDF Proxy: Stream error:", error.message);
//       if (!res.headersSent) {
//         res.status(500).json({ message: "Stream error occurred" });
//       }
//     });

//   } catch (error) {
//     console.error("PDF Proxy Error:", error.message);
//     console.error("Full error:", error);
    
//     if (!res.headersSent) {
//       res.status(500).json({ 
//         message: "Failed to load PDF",
//         error: error.message,
//         type: error.code || 'UNKNOWN'
//       });
//     }
//   }
// });

// module.exports = router;