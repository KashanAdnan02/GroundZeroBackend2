// config/multer.js
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

const uploadFolder = path.join(__dirname, "..", "uploads", "user_avatars");

// ensure folder exists
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const fileName = `user_${uuidv4()}${ext}`;
    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  // accept images only
  const allowed = /jpeg|jpg|png|gif/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetypeOK = allowed.test(file.mimetype);
  const extOK = allowed.test(ext);
  if (mimetypeOK && extOK) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, png, gif) are allowed"));
  }
};

const limits = {
  fileSize: 2 * 1024 * 1024, // 2MB
};

const upload = multer({ storage, fileFilter, limits });

module.exports = upload;
