const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');//audio acceptance
const app = express();
const PORT = 5000;

//multer for audio file handling
const storage = multer.diskStorage({
    destination: (req,file,cb) => {
        const uploadDir = path.join(__dirname,'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null,uploadDir); 
    },
    filename: (req,file,cb) => {
        const timestamp = Date.now();//name with timestamp
        cb(null,`${timestamp}_${file.originalname}`);
    }
});
const upload = multer({storage: storage});

//middleware to parse json bodies
app.use(express.json());
//cors as running on diff ports
app.use(cors());
app.use(express.urlencoded({extended: true})); //for parsing url-encoded data

//endpoint to receive data and save it as json
app.post('/api/save_artisan_data',
  upload.fields([
    { name: "audioFile", maxCount: 1 },
    { name: "images", maxCount: 10 }
  ]),
  (req, res) => {
    try {
      const { artisanData } = req.body;
      const audioFile = req.files["audioFile"] ? req.files["audioFile"][0] : null;
      const images = req.files["images"] || [];

      if (!artisanData) {
        return res.status(400).json({ message: "No artisan data provided" });
      }

      const folderPath = path.join(__dirname, "data");
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }

      const filename = `artisan_data_${Date.now()}.json`;
      const filepath = path.join(folderPath, filename);

      const finalData = {
        ...JSON.parse(artisanData),
        audioFile: audioFile ? audioFile.filename : null,
        images: images.map((img) => img.filename),
      };

      fs.writeFileSync(filepath, JSON.stringify(finalData, null, 2));

      res.status(200).json({
        message: "Data saved successfully",
        filename,
        audioFile: audioFile ? audioFile.filename : null,
        images: images.map((img) => img.filename),
      });
    } catch (err) {
      console.error("Error saving artisan data:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

//start server
app.listen(PORT, () => {
    console.log(`backend server running on http://localhost:${PORT}`);
});