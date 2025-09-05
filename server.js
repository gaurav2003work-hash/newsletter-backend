// ------------------------------
// Import Dependencies
// ------------------------------
import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
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
// Get Current Directory (__dirname in ES Modules)
// ------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------------
// CORS Configuration
// ------------------------------
const allowedOrigins = [
  "http://localhost:3000", // Local React testing
  "http://127.0.0.1:5500", // VSCode Live Server
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

// ------------------------------
// Serve Static Files (Logo, etc.)
// ------------------------------
app.use("/public", express.static(path.join(__dirname, "public")));

// ------------------------------
// Health Check Route
// ------------------------------
app.get("/", (req, res) => {
  res.status(200).send("✅ Newsletter Backend is Running Successfully!");
});

// ------------------------------
// POST API: Send Newsletter
// ------------------------------
app.post("/send-newsletter", async (req, res) => {
  try {
    const { emails, subject, message } = req.body;

    // Validate request body
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
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

    // ------------------------------
    // Configure Nodemailer Transporter
    // ------------------------------
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify connection
    await transporter.verify();

    // ------------------------------
    // Send Emails Individually
    // ------------------------------
    for (const email of emails) {
      await transporter.sendMail({
        from: `"Your Company" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: `
          <div style="font-family: 'Arial', sans-serif; background-color: #f8f9ff; padding: 20px; border-radius: 12px; max-width: 600px; margin: auto; box-shadow: 0 0 12px rgba(0,0,0,0.1);">
            
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="cid:companyLogo" alt="Company Logo" style="height: 80px;" />
            </div>
            
            <h2 style="color: #6a11cb; font-size: 22px; margin-bottom: 15px; text-align: center;">${subject}</h2>
            
            <div style="color: #333; font-size: 16px; line-height: 1.6; background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              ${message}
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #888; font-size: 13px;">
              © ${new Date().getFullYear()} Your Company. All rights reserved.
            </div>
          </div>
        `,
        attachments: [
          {
            filename: "logo.png",
            path: path.join(__dirname, "public", "logo.png"), // Path to your logo
            cid: "companyLogo", // Reference ID used in <img src="cid:companyLogo">
          },
        ],
      });
    }

    res.status(200).json({
      success: true,
      message: `✅ Newsletter sent to ${emails.length} recipients successfully!`,
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
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
  console.log(`🌍 Live API: https://newsletter-backend-uvqx.onrender.com`);
});
