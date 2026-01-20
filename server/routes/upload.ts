import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";

const router = Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("只支持圖片文件（JPEG, PNG, GIF, WebP）"));
    }
  },
});

// Upload image endpoint
router.post("/upload-image", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "沒有上傳文件" });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const ext = path.extname(req.file.originalname);
    const filename = `tour-${timestamp}-${randomString}${ext}`;

    // Compress and resize image
    const compressedBuffer = await sharp(req.file.buffer)
      .resize(1200, 675, { // 16:9 aspect ratio
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Save to public directory
    const publicDir = path.join(process.cwd(), "client/public/tour-images");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const filePath = path.join(publicDir, filename);
    fs.writeFileSync(filePath, compressedBuffer);

    // Return public URL
    const imageUrl = `/tour-images/${filename}`;

    res.json({
      success: true,
      imageUrl,
    });
  } catch (error: any) {
    console.error("[Upload] Error:", error);
    res.status(500).json({ error: error.message || "上傳失敗" });
  }
});

export default router;
