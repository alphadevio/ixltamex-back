const { Router } = require("express");
const multer = require('multer');
const { ClientController } = require("../controllers/ClientController");

const ClientRoutes = Router();

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/'); // Where to store the uploaded files
  },
  filename: function (req, file, cb) {
    // Extracting the file extension
    const ext = file.originalname.split('.').pop();
    // Appending the file extension to the filename
    const filename = new Date().valueOf() + '.' + ext;
    cb(null, filename);
}
});

const upload = multer({ storage: storage });


ClientRoutes.post('/',upload.single('document'),ClientController.save)
ClientRoutes.put('/',upload.single('document'),ClientController.update)
ClientRoutes.get('/',ClientController.fetch)
ClientRoutes.delete('/',ClientController.destroy)

module.exports.ClientRoutes = ClientRoutes





