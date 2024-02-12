import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import pg from "pg";

const pool = new pg.Pool({
  user: "postgres",
  host: "localhost",
  database: "ssc",
  password: "0000",
  port: 5432,
});

const app = express();
const port = 2000;

// Multer configuration with increased header size limit
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fieldSize: 1 * 1024 * 1024 }, // Adjust the limit based on your requirements
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// GET home page
app.get("/", (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Handle image uploads for q_img, a_img, b_img, c_img, d_img
const uploadFields = ["q_img", "a_img", "b_img", "c_img", "d_img"];
const uploadFieldsMiddleware = upload.fields(uploadFields.map(field => ({ name: field })));

// POST data and image uploads
app.post("/", uploadFieldsMiddleware, async (req, res) => {
  try {
    // Extract form data
    const {
      question,
      q_value,
      a,
      b,
      c,
      d,
      ans
    } = req.body;

    // Extract images from the uploaded files
    const images = uploadFields.map(field => {
      const fileArray = req.files[field];
      if (fileArray && fileArray.length > 0) {
        return fileArray[0].buffer;
      }
      return null;  // or handle the case where the file is not present
    });

    // Insert data into the PostgreSQL database
    await pool.query(
      "INSERT INTO ssc_je_civil_pre_16_11_2022_S1 (question, q_value, a, b, c, d, ans, q_img, a_img, b_img, c_img, d_img) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
      [question, q_value, a, b, c, d, ans, ...images]
    );

    console.log("Data added successfully");
    res.redirect("/");
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
