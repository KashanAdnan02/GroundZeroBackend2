const multer = require("multer");
const path = require("path");
const fs = require("fs");
const uploadFolder = path.join(__dirname, "..", "uploads", "user_avatars");

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}
let uuidv4;
(async () => {
  const uuid = await import("uuid");
  uuidv4 = uuid.v4;
})();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const fileName = `user_${uuidv4 ? uuidv4() : Date.now()}${ext}`;
    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
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
  fileSize: 2 * 1024 * 1024,
};

const upload = multer({ storage, fileFilter, limits });

module.exports = upload;
