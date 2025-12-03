// server.js
import express from "express";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { VertexAI } from "@google-cloud/vertexai";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// -----------------------------
// Multer: file upload setup
// -----------------------------
const upload = multer({
	dest: "uploads/",
	limits: {
		fileSize: 20 * 1024 * 1024, // 20 MB
	},
	fileFilter: (req, file, cb) => {
		const allowed = [
			"application/pdf",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"image/png",
			"image/jpeg",
			"image/jpg",
		];
		if (!allowed.includes(file.mimetype)) {
			return cb(new Error("Unsupported file type"));
		}
		cb(null, true);
	},
});

// -----------------------------
// GCP Vision client (OCR)
// -----------------------------
const visionClient = new ImageAnnotatorClient();

/**
 * Use Google Cloud Vision to extract text from the uploaded file.
 * For this prototype we directly call documentTextDetection on the local file.
 * (Works great for images; for PDFs this is a simplified demo approach.)
 */
async function extractTextWithGcpOcr(filePath, mimetype) {
	const [result] = await visionClient.documentTextDetection(filePath);
	const fullText = result.fullTextAnnotation?.text || "";
	return fullText;
}

// -----------------------------
// Vertex AI (Gemini) client
// -----------------------------
const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_LOCATION || "us-central1";

if (!PROJECT_ID) {
	console.warn(
		"⚠️ GCP_PROJECT_ID not set. Please define it in your .env file."
	);
}

const vertexAI = new VertexAI({
	project: PROJECT_ID,
	location: LOCATION,
});

const generativeModel = vertexAI.getGenerativeModel({
	model: "gemini-1.5-flash", // or "gemini-1.5-pro"
});

/**
 * Call Vertex AI Gemini to convert OCR text → structured JSON timetable.
 */
async function extractTimetableWithVertexGemini(ocrText) {
	const prompt = `
You are a timetable parser.

The input is OCR text of a teacher's weekly class timetable (possibly noisy).
Your job is to extract a clean JSON list of timetable blocks.

Each timetable block should have this shape:

{
  "dayOfWeek": string | null,  // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" or null if unknown
  "startTime": "HH:MM",        // 24-hour time, zero padded, e.g. "08:55"
  "endTime": "HH:MM",          // 24-hour time, zero padded, e.g. "10:10"
  "subject": string | null,    // subject or label for that block, e.g. "Maths", "Register", "English B"
  "room": string | null,       // room or location if available, else null
  "teacher": string | null     // teacher name or initials if present in the text, else null
}

Rules:
- Convert times like "8.55" or "8:55" into "08:55".
- If the day-of-week is unclear, set "dayOfWeek": null.
- Do NOT invent data that is not present in the text.
- If some field is missing, set it to null.
- Return STRICTLY valid JSON, no comments, no markdown, no extra text.
- The top-level structure MUST be exactly:
{ "blocks": [ TimetableBlock, TimetableBlock, ... ] }

Here is the OCR text to parse:
"""${ocrText}"""
`;

	const request = {
		contents: [
			{
				role: "user",
				parts: [{ text: prompt }],
			},
		],
		generationConfig: {
			temperature: 0.1,
			maxOutputTokens: 2048,
		},
	};

	const response = await generativeModel.generateContent(request);

	const candidate = response?.response?.candidates?.[0];
	if (!candidate || !candidate.content || !candidate.content.parts) {
		throw new Error("No candidate returned from Vertex AI");
	}

	const responseText = candidate.content.parts
		.map((p) => p.text || "")
		.join("")
		.trim();

	// In case model wraps JSON in ```json ``` fences
	const cleaned = responseText.replace(/```json|```/g, "").trim();

	let json;
	try {
		json = JSON.parse(cleaned);
	} catch (err) {
		console.error("Failed to parse JSON from Vertex Gemini:", cleaned);
		throw new Error("Vertex AI returned invalid JSON");
	}

	if (!json.blocks || !Array.isArray(json.blocks)) {
		throw new Error("Vertex AI JSON missing 'blocks' array");
	}

	return json.blocks;
}

// -----------------------------
// Routes
// -----------------------------

// Simple health check
app.get("/", (req, res) => {
	res.send("Timetable OCR + Vertex AI backend is running.");
});

/**
 * POST /api/upload-timetable
 * Body: form-data with field "file" (PDF/image/DOCX-as-image)
 */
app.post(
	"/api/upload-timetable",
	upload.single("file"),
	async (req, res) => {
		if (!req.file) {
			return res.status(400).json({ error: "No file uploaded" });
		}

		const filePath = req.file.path;
		const mimeType = req.file.mimetype;
		const originalName = req.file.originalname;

		try {
			// 1. OCR using GCP Vision
			const rawText = await extractTextWithGcpOcr(filePath, mimeType);

			// 2. LLM (Vertex AI Gemini) to extract structured timetable JSON
			const blocks = await extractTimetableWithVertexGemini(rawText);

			// 3. Respond with JSON
			return res.json({
				fileName: originalName,
				mimeType,
				blocks,  // structured result
			});
		} catch (err) {
			console.error("Error processing file:", err);
			return res.status(500).json({
				error: "Failed to process file",
				details: err.message,
			});
		} finally {
			// Clean up temporary file
			fs.unlink(filePath, () => { });
		}
	}
);

// -----------------------------
// Start server
// -----------------------------
app.listen(port, () => {
	console.log(`Server listening on http://localhost:${port}`);
});
