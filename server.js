// ------------------------------
// Import Dependencies
// ------------------------------
import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";

// Load environment variables from .env
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ------------------------------
// Middleware
// ------------------------------
app.use(
  cors({
    origin: "*", // Allow all origins for now (change to Netlify URL after deployment)
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ------------------------------
// Health Check Route
// ------------------------------
app.get("/", (req, res) => {
  res.send("✅ Newsletter Backend is Running Successfully!");
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
        .json({ success: false, message: "No recipient emails provided." });
    }

    if (!subject || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Subject and message are required." });
    }

    // ------------------------------
    // Configure Nodemailer Transporter
    // ------------------------------
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Gmail ID from .env
        pass: process.env.EMAIL_PASS, // App Password from .env
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
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f7fc; border-radius: 10px;">
            <div style="text-align: center;">
              <img src="https://your-company-logo-link.com/logo.png" alt="Company Logo" style="width: 120px; margin-bottom: 15px;" />
            </div>
            <h2 style="color: #6a11cb;">${subject}</h2>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              ${message}
            </p>
            <br>
            <p style="font-size: 14px; color: #666;">
              Best Regards,<br>
              <strong>Your Newsletter Team 🚀</strong>
            </p>
          </div>
        `,
      });
    }

    // Success Response
    res
      .status(200)
      .json({ success: true, message: "✅ Emails sent successfully!" });
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    res
      .status(500)
      .json({ success: false, message: "Internal Server Error. Failed to send emails." });
  }
});

// ------------------------------
// Start Express Server
// ------------------------------
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
