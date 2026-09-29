import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import Replicate from "replicate";

dotenv.config();

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024
  }
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

app.use(cors());
app.use(express.json());
app.use(express.static("."));

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

app.post("/api/enhance-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "لم يتم اختيار صورة"
      });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return res.status(500).json({
        error: "مفتاح الذكاء الاصطناعي غير موجود"
      });
    }

    const output = await replicate.run(
      "nightmareai/real-esrgan",
      {
        input: {
          image: req.file.buffer,
          scale: 4,
          face_enhance: false
        }
      }
    );

    const url =
      typeof output?.url === "function"
        ? output.url()
        : String(output);

    res.json({
      success: true,
      url
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "حدث خطأ أثناء تحسين الصورة"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
