// ------------------------------
// Import Dependencies
// ------------------------------
import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
import multer from "multer"; // ✅ For handling file uploads
import path from "path";
import { fileURLToPath } from "url";

// ------------------------------
// Load Environment Variables
// ------------------------------
dotenv.config();

// ------------------------------
// Initialize Express App
// ------------------------------
const app = express();
const PORT = process.env.PORT || 5000;

// ------------------------------
// Get Current Directory
// ------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------------
// File Upload Config (Multer)
// ------------------------------
const upload = multer({ dest: "uploads/" });

// ------------------------------
// CORS Configuration
// ------------------------------
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:5500",
  "https://newsletter-cons.netlify.app", // ✅ Your Netlify frontend
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS Blocked: ${origin}`);
        callback(new Error("❌ Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

// ------------------------------
// Middleware
// ------------------------------
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ------------------------------
// Health Check Route
// ------------------------------
app.get("/", (req, res) => {
  res.status(200).send("✅ Newsletter Backend is Running Successfully!");
});

// ------------------------------
// POST API: Send Newsletter
// ------------------------------
app.post("/send-newsletter", upload.array("attachments"), async (req, res) => {
  try {
    const { emails, subject, message, links } = req.body;
    const parsedEmails = JSON.parse(emails);
    const parsedLinks = JSON.parse(links || "[]");

    // Validation
    if (!parsedEmails || !Array.isArray(parsedEmails) || parsedEmails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "⚠️ No recipient emails provided.",
      });
    }

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "⚠️ Subject and message are required.",
      });
    }

    // Configure Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify transporter connection
    await transporter.verify();

    // Attachments
    const attachments = req.files.map((file) => ({
      filename: file.originalname,
      path: file.path,
    }));

    // HTML Email Template
    const htmlTemplate = (recipientName = "Subscriber") => `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 650px; margin: auto; background: #ffffff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:companyLogo" alt="Company Logo" style="height: 80px;" />
          </div>

          <h2 style="color: #6a11cb; text-align: center; margin-bottom: 10px;">${subject}</h2>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">${message}</p>

          ${
            parsedLinks.length > 0
              ? `<div style="margin-top: 20px; padding: 15px; background-color: #f1f5f9; border-radius: 8px;">
                   <h3 style="color: #6a11cb; margin-bottom: 8px;">🔗 Useful Links</h3>
                   <ul style="list-style:none; padding:0;">
                     ${parsedLinks
                       .map((link) => `<li><a href="${link}" style="color:#2563eb; text-decoration:none;">${link}</a></li>`)
                       .join("")}
                   </ul>
                 </div>`
              : ""
          }

          <div style="margin-top: 25px; text-align: center;">
            <a href="https://conspicuous-solutions.in/" style="background-color:#6a11cb; color:white; padding:10px 20px; text-decoration:none; border-radius:6px; font-weight:bold;">Visit Our Website</a>
          </div>

          <hr style="margin:25px 0;border:none;border-top:1px solid #e5e7eb" />

          <div style="text-align:center; color:#666; font-size:13px;">
            © ${new Date().getFullYear()} Your Company. All rights reserved.
          </div>
        </div>
      </div>
    `;

    // Send Emails Individually
    for (const email of parsedEmails) {
      await transporter.sendMail({
        from: `"Your Company" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html: htmlTemplate(),
        attachments: [
          ...attachments,
          {
            filename: "logo.png",
            path: path.join(__dirname, "public", "logo.png"),
            cid: "companyLogo",
          },
        ],
      });
    }

    res.status(200).json({
      success: true,
      message: `✅ Newsletter sent to ${parsedEmails.length} recipients successfully!`,
    });
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    res.status(500).json({
      success: false,
      message: "❌ Internal Server Error. Failed to send emails.",
      error: error.message,
    });
  }
});

// ------------------------------
// Handle 404 Routes
// ------------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "❌ API route not found",
  });
});

// ------------------------------
// Start Express Server
// ------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Live API: https://newsletter-backend-uvqx.onrender.com`);
});
