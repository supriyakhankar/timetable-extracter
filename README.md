
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

## 1.6.1 Upload Timetable File

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

----

### 




