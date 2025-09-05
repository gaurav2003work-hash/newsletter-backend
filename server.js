// ------------------------------
// Import Dependencies
// ------------------------------
import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan"; // For better logs

// ------------------------------
// Load environment variables
// ------------------------------
dotenv.config();

// ------------------------------
// Initialize Express App
// ------------------------------
const app = express();
const PORT = process.env.PORT || 5000;

// ------------------------------
// CORS Configuration
// ------------------------------
// Change this to your Netlify URL after deployment for better security
const allowedOrigins = [
  "http://localhost:3000",            // Local testing
  "http://127.0.0.1:5500",           // If you're using Live Server
  "https://newsletter-frontend.netlify.app", // Your Netlify frontend URL (replace later)
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("❌ Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// ------------------------------
// Middleware
// ------------------------------
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev")); // Log all incoming requests

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
    if (!emails || emails.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "⚠️ No recipient emails provided." });
    }

    if (!subject || !message) {
      return res
        .status(400)
        .json({ success: false, message: "⚠️ Subject and message are required." });
    }

    // ------------------------------
    // Configure Nodemailer Transporter
    // ------------------------------
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Gmail ID from .env
        pass: process.env.EMAIL_PASS, // Gmail App Password from .env
      },
    });

    // ------------------------------
    // Send Emails Individually
    // ------------------------------
    for (const email of emails) {
      await transporter.sendMail({
        from: `"Your Company" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f7fc; border-radius: 10px; max-width: 600px; margin: auto;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://your-company-logo-link.com/logo.png" alt="Company Logo" style="width: 120px;" />
            </div>
            <h2 style="color: #6a11cb; font-size: 24px; margin-bottom: 10px;">${subject}</h2>
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              ${message}
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p style="font-size: 14px; color: #666; text-align: center;">
              Best Regards,<br>
              <strong>Your Newsletter Team 🚀</strong>
            </p>
          </div>
        `,
      });
    }

    // Success Response
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


// Handle 404 Routes

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
});
