
# 1. Detailed Setup Instructions

This section explains how to set up and run the **Timetable Upload & AI Extraction API** locally using **Node.js, Express, Multer, Google Vision OCR, and Vertex AI**.

---

## 1.1 Prerequisites

Before starting, ensure the following are installed and configured:

- Node.js (v18 or later recommended)
- npm (comes with Node.js)
- A Google Cloud project with:
  - Vision API enabled
  - Vertex AI enabled
- A Google Cloud Service Account with:
  - Vision API access
  - Vertex AI access
- A Service Account JSON key file

---

## 1.2 Clone the Project

```bash
git clone <your-repository-url>
cd backend
```

---

## 1.3 Install Dependencies

Run the following inside the backend folder:

```bash
npm install
```

---

## 1.4 Create the .env File

Create a .env file in the root of the backend folder:

```bash
touch .env
```

Add the following:

```env
PORT=4000

# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS=./gcp-key.json
GCP_PROJECT_ID=your_project_id
GCP_LOCATION=us-central1

# Vertex AI Model
VERTEX_MODEL=gemini-1.0-pro
```

Replace:
- your_project_id with your actual Google Cloud Project ID
- gcp-key.json with your real service account key file

---

## 1.5 Start the Server

```bash
node index.js
```

You should see:

```bash
Server running on port 4000
```

---

## 1.6 Verify the API Is Running

Use Postman or Curl:

```http
GET http://localhost:4000/
```

The API is now ready to accept timetable files and return structured JSON.


---

## 2 API Documentation

## 2.1 Upload Timetable File

Uploads a timetable file, runs Google Cloud Vision OCR on it, then uses Vertex AI (Gemini) to extract structured timetable blocks from the OCR text.

### POST /api/upload-timetable

Method: POST  
URL: /api/upload-timetable  
Content-Type: multipart/form-data  

---

### Request (form-data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file  | File | Yes      | Timetable PDF / Image / DOCX |

Supported File Types:

- PDF
- DOCX
- PNG
- JPG / JPEG

---

### Example using curl

```bash
curl -X POST http://localhost:4000/api/upload-timetable \
  -F "file=@Teacher_Timetable_Example_2.pdf"
```
----

### Successful Response 
```bash
{
  "fileName": "Teacher_Timetable_Example_2.pdf",
  "mimeType": "application/pdf",
  "rawText": "Full OCR text...",
  "blocks": [
    {
      "dayOfWeek": "Mon",
      "startTime": "08:55",
      "endTime": "10:10",
      "subject": "English",
      "room": null,
      "teacher": null
    }
  ]
}
```

# 3. Known Issues & Limitations

This section documents the current technical and functional limitations of the Timetable Upload & AI Extraction system based on its OCR + LLM-driven architecture.

---

## 3.1 OCR Accuracy Limitations

- Low-resolution images, blurred scans, skewed photographs, or poor lighting conditions significantly reduce OCR accuracy.
- Handwritten timetables may produce incorrect or incomplete text output.
- Decorative fonts, multi-color backgrounds, and overlapping text can lead to missed or misread characters.

**Impact:**
- Incorrect subject names  
- Missing time values  
- Misaligned day detection  

---

## 3.2 Complex Table Structures

The system currently handles standard grid-based timetables best. Limitations exist for:

- Merged cells across rows or columns  
- Nested tables  
- Multi-layer headers  
- Floating text outside grid boundaries  

**Impact:**
- Incorrect timeblock grouping  
- Incorrect day-to-column mapping  
- Manual correction may be required  

---

## 3.3 Time Inference & Ambiguity

AI-based time normalization relies on textual patterns. Issues may occur when:

- Start/end times are missing  
- Only durations are provided  
- Ranges are written ambiguously (e.g., “9–10” vs “9–10:30”)  
- Breaks and activities overlap in unclear ways  

**Impact:**
- Overlapping timeblocks  
- Gaps in the timetable  
- Reduced confidence scores on extracted blocks  

---

## 3.4 Confidence Scores Are Probabilistic

Each extracted timeblock includes a confidence score, but:

- High confidence does not guarantee 100% correctness  
- Low confidence does not always indicate incorrect data  

**Impact:**
- Manual review is still required for production-grade accuracy  
- Fully automated ingestion without review is not recommended  

---

## 3.5 No Multi-Week or Rotational Timetable Support

The current data model assumes:

- One fixed weekly timetable  
- One `week_start_date` per timetable  

The following are not yet fully supported:

- Week A / Week B rotational schedules  
- Monthly academic cycles  
- Seasonal timetable variations  

---

## 3.6 Latency & Performance Constraints

Processing time depends on:

- File size  
- OCR provider latency  
- LLM response time  
- Network stability  

Large files or high-resolution scans may cause:

- Slow API response  
- Timeouts during heavy loads  
- Increased cloud processing cost  

---

## 3.7 API Is Synchronous in Current Version

In the current implementation:

- Upload → OCR → AI Structuring → JSON Response happens in one synchronous API call

**Impact:**
- Not ideal for very large documents  
- Not optimized for mass uploads  
- Not suitable for high-traffic production environments without async workers  

---

## 3.8 Cost Dependency on Cloud AI Services

The system relies on paid cloud services for:

- OCR processing  
- LLM-based structuring  

**Impact:**
- High usage increases operational cost  
- Free-tier limits may cause throttling  
- Requires careful request batching in production  

---

## 3.9 Language & Locale Limitations

The system is currently optimized for:

- English timetables  
- Western numeric time formats  

Limitations apply to:

- Regional languages  
- Mixed-language timetables  
- Non-standard academic time formats  

---







