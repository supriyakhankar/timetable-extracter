
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

# 4. Use of AI-Based Tools to Enhance Productivity

AI-based tools were used in two key areas of this project:
1. **Inside the application for timetable extraction**
2. **During development to improve engineering productivity**

This hybrid usage significantly reduced manual effort, improved accuracy, and accelerated delivery.

---

## 4.1 AI Usage Inside the Application

### 4.1.1 OCR Automation Using AI

The system uses AI-based OCR (Google Vision API) to:

- Automatically extract text from:
  - Scanned PDFs
  - Mobile photographs
  - Printed timetables
- Remove the need for any manual data entry.
- Convert unstructured visual data into machine-readable text.

**Productivity Impact:**
- Eliminates hours of manual typing.
- Enables instant digitization of paper-based timetables.
- Works across multiple file formats with the same pipeline.

---

### 4.1.2 AI-Based Timetable Structuring Using LLMs (Vertex AI)

After OCR, raw text is converted into structured timetable JSON using a Large Language Model via Vertex AI.

The AI is used to:

- Identify:
  - Days of the week
  - Start and end times
  - Subjects / activities
- Convert human-written formats into normalized data:
  - Example: “9–9.30” → `09:00`–`09:30`
- Infer missing values where possible
- Generate confidence scores for each extracted timeblock

**Productivity Impact:**
- Removes the need to write complex rule-based parsers.
- Handles multiple layout styles with the same prompt.
- Converts unstructured OCR text into frontend-ready JSON instantly.

---

### 4.1.3 Intelligent Error Detection & Confidence Scoring

AI-based extraction assigns a confidence score to each timeblock.

This allows the system to:

- Flag low-confidence blocks automatically
- Prioritize human review only where needed
- Avoid full manual verification of all data

**Productivity Impact:**
- Reduces human verification workload.
- Enables faster review cycles.
- Improves trust in automated extraction.

---

## 4.2 AI Usage During Development (Developer Productivity)

AI tools (such as ChatGPT / AI coding assistants) were also actively used during project development to improve engineering efficiency and design quality.

---

### 4.2.1 System Architecture & Design Support

AI was used to:

- Brainstorm high-level system architecture
- Refine the OCR + LLM extraction pipeline
- Design:
  - Upload flow
  - Processing layers
  - Validation strategy
  - API contracts
- Identify missing components such as:
  - Admin review flows
  - Human-in-the-loop validation
  - Scalability risks

**Productivity Impact:**
- Faster system design iteration.
- Reduced design rework.
- Improved architectural clarity for interviews and documentation.

---

### 4.2.2 Code Generation & Refactoring Assistance

AI tools were used to accelerate:

- Express.js API boilerplate generation
- Multer upload handling
- Service-layer separation (OCR service, AI service)
- Error-handling structure
- Consistent JSON API responses

**Productivity Impact:**
- Reduced development time for repetitive code.
- Faster prototyping of production-like APIs.
- Cleaner separation of concerns.

---

### 4.2.3 Documentation & ReadMe Generation

AI significantly helped in creating:

- System documentation
- API documentation
- Architecture explanations
- Known limitations
- Productivity justifications

**Productivity Impact:**
- High-quality documentation created quickly.
- Consistent formatting across sections.
- Improved project presentation for interviews and reviews.

---
# 5. Future Enhancements

This section outlines the planned and potential enhancements that can be implemented to evolve the Timetable Upload & AI Extraction system into a full-scale, production-grade platform.

---

## 5.1 Asynchronous Processing & Job Queue

Introduce a background job-processing system using technologies such as:

- Google Pub/Sub  
 
This will allow:

- Non-blocking document uploads  
- Parallel OCR and AI processing  
- Better handling of large files  
- Improved system stability under heavy load  

---

## 5.2 Authentication & Role-Based Access Control

Add secure authentication using:

- JWT / OAuth  
- Role-based access control (Teacher, Admin, Super Admin)

This will enable:

- Secure API access  
- Controlled timetable visibility  
- Admin moderation panels  
- Proper access auditing  

---

## 5.3 Admin Review & Manual Validation Dashboard

Develop a dedicated admin interface to:

- View low-confidence AI extractions  
- Manually correct ambiguous timeblocks  
- Approve or reject processed timetables  
- Monitor processing quality metrics  

This strengthens the human-in-the-loop workflow.

---

## 5.4 Multi-Week & Rotational Timetable Support

Extend the data model to support:

- Week A / Week B schedules  
- Monthly academic cycles  
- Seasonal timetable changes  
- Exam-time or holiday variations  

This enables real-world academic deployment.

---

## 5.5 Advanced Conflict Detection

Implement automated detection of:

- Overlapping timeblocks  
- Teacher double-booking  
- Room clashes  
- Break-time violations  

This will improve timetable reliability and operational safety.

---

## 5.6 Multi-Language & Localization Support

Enhance system support for:

- Regional languages  
- Multilingual timetables  
- Locale-specific time formats  
- Right-to-left languages (future scope)

---

## 5.7 Model Feedback & Continuous Learning Pipeline

Implement a continuous improvement workflow where:

- Manual corrections are stored as training signals  
- Extraction prompts and rules are refined based on error patterns  
- AI accuracy improves automatically over time  

---

## 5.8 Mobile Application Support

Develop native or cross-platform mobile apps to allow teachers to:

- Upload timetables directly from mobile cameras  
- Review extracted schedules on the go  
- Perform quick corrections  

---









