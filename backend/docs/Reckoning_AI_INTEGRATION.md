# Reckoning × AI Detection Integration

> YOLOv8 road defect detection powered by HuggingFace Spaces

---

## Overview

The **Reckoning AI** module connects Reckoning's Express.js backend to a YOLOv8-based road defect detection model hosted on HuggingFace Spaces. Citizens can upload a photo and receive instant AI-powered suggestions for issue category and severity *before* filing their complaint.

After detection, the model returns an **annotated image** with bounding boxes, severity labels, and confidence scores drawn on the original photo. This annotated image is stored in S3 and available to the citizen for download.

Key design principles:
- **Graceful degradation** — AI failure never blocks complaint submission
- **Non-blocking** — detection returns `null` on timeout/error, not a 500
- **Security-first** — file ownership verified, API key required, no anonymous AI calls
- **User sovereignty** — AI suggests, citizen decides (can override category/severity)
- **Downloadable results** — annotated detection image stored in S3, available via presigned URL

---

## Architecture

```
┌────────────┐       ┌──────────────────┐       ┌─────────────────────┐
│  Citizen   │──────▶│  POST /api/ai/   │──────▶│  Reckoning HF Space │
│  (Mobile)  │       │     detect       │       │  (YOLOv8 Inference) │
└────────────┘       └──────────────────┘       └─────────────────────┘
                              │                          │
                     ┌────────▼────────┐        ┌───────▼───────────────┐
                     │   S3 (fetch     │        │  JSON response         │
                     │   image buffer) │        │  + annotated base64    │
                     └─────────────────┘        └───────┬───────────────┘
                                                        │
                                               ┌────────▼────────┐
                                               │ Decode base64    │
                                               │ Upload to S3     │
                                               │ Return signed URL│
                                               └─────────────────┘
```

### Full Flow (Detection + Download)

1. Citizen uploads a photo via `POST /api/upload` → gets a `mediaId`
2. Citizen sends `POST /api/ai/detect` with `{ fileId: mediaId }`
3. Backend fetches the image buffer from S3
4. Backend sends the image to Reckoning HF Space via multipart POST
5. HF Space runs YOLOv8 inference, draws bounding boxes, returns detections + annotated image
6. Backend maps raw labels to Reckoning enums, decodes annotated image, uploads to S3
7. Response includes: suggested category, severity, confidence, bounding boxes, **and annotated image download URL**
8. Citizen can **download/view the annotated image** using the returned URL
9. If the URL expires (24h), citizen can **re-generate** it via the download endpoint

---

## API Endpoints

### POST /api/ai/detect — Run AI Detection

Analyse an uploaded image for road defects. Returns AI suggestions + annotated result image.

**Auth:** `Bearer <citizen_token>` required

**Request:**
```json
{
  "fileId": "clxyz123abc456def789"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "suggestedCategory": "POTHOLE",
    "suggestedSeverity": "HIGH",
    "confidence": 0.913,
    "allDetectedIssues": ["POTHOLE", "CRACKS_DAMAGE"],
    "totalDetected": 2,
    "inferenceMs": 4028,
    "detections": [
      {
        "rawLabel": "pothole",
        "category": "POTHOLE",
        "severity": "HIGH",
        "confidence": 0.913,
        "bbox": { "x1": 429, "y1": 529, "x2": 1192, "y2": 940 }
      },
      {
        "rawLabel": "crack",
        "category": "CRACKS_DAMAGE",
        "severity": "MEDIUM",
        "confidence": 0.74,
        "bbox": { "x1": 50, "y1": 200, "x2": 200, "y2": 310 }
      }
    ],
    "annotatedImage": {
      "url": "https://your-bucket.s3.ap-south-1.amazonaws.com/ai-results/userId/2026/06/06/uuid.jpg?X-Amz-...",
      "expiresIn": 86400,
      "s3Key": "ai-results/userId/2026/06/06/uuid.jpg"
    },
    "message": "Detected 2 issue(s). Review and confirm."
  }
}
```

**The `annotatedImage.url` is a direct download link** — open it in a browser or use it in an `<img>` tag.

**When no detections / no annotated image:**
```json
{
  "annotatedImage": null
}
```

**AI Unavailable (503):**
```json
{
  "success": false,
  "error": {
    "code": "AI_UNAVAILABLE",
    "message": "AI analysis is temporarily unavailable. You can still submit your complaint manually."
  }
}
```

---

### GET /api/ai/result/:s3Key/download — Download Annotated Image

Re-generate a fresh presigned download URL for an annotated result image. Use this when the original URL from `/detect` has expired (24-hour expiry).

**Auth:** `Bearer <citizen_token>` required

**URL Parameter:** `:s3Key` must be **base64url-encoded**

**Example Request:**
```
GET http://localhost:8000/api/ai/result/YWktcmVzdWx0cy91c2VyMTIzLzIwMjYvMDYvMDYvdXVpZC5qcGc/download
Authorization: Bearer <citizen_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "https://your-bucket.s3.ap-south-1.amazonaws.com/ai-results/...",
    "expiresIn": 86400
  }
}
```

**The `data.url` is the fresh download link** — valid for 24 hours.

**Security:** The endpoint verifies the S3 key starts with `ai-results/{your-userId}/` — you can only download your own annotated images.

---

### GET /api/ai/health — Check AI Status

Public endpoint, no auth required.

```
GET http://localhost:8000/api/ai/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "Reckoning": {
      "online": true,
      "latencyMs": 342,
      "modelInfo": "yolov8n-roaddefects-v2"
    },
    "timestamp": "2026-06-06T12:00:00.000Z"
  }
}
```

---

## How to Download the AI Detection Result Image

### Method 1: Directly from the detect response

After calling `POST /api/ai/detect`, the response contains `annotatedImage.url`:

```javascript
const response = await fetch('http://localhost:8000/api/ai/detect', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ fileId: 'your-media-id' })
});

const result = await response.json();

if (result.data.annotatedImage) {
  // This URL is a direct download link (valid for 24 hours)
  const imageUrl = result.data.annotatedImage.url;
  
  // Option A: Open in browser
  window.open(imageUrl, '_blank');
  
  // Option B: Download programmatically
  const imgResponse = await fetch(imageUrl);
  const blob = await imgResponse.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'reckoning-detection-result.jpg';
  link.click();
  
  // Option C: Display in <img> tag
  document.getElementById('result').src = imageUrl;
}
```

### Method 2: Re-download after URL expires

URLs expire after 24 hours. To get a fresh one, use the download endpoint:

```javascript
// The s3Key from the original detect response
const s3Key = result.data.annotatedImage.s3Key;
// e.g. "ai-results/user123/2026/06/06/a1b2c3d4.jpg"

// Base64url-encode the key (required for URL safety)
const encodedKey = btoa(s3Key)
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

const freshUrl = await fetch(
  `http://localhost:8000/api/ai/result/${encodedKey}/download`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);

const { data } = await freshUrl.json();
// data.url → new presigned URL valid for another 24h
```

### Method 3: From the complaint detail

After a complaint is filed, the annotated image is also accessible from the complaint:

```
GET http://localhost:8000/api/complaints/<complaintId>
Authorization: Bearer <citizen_token>
```

The response includes:
```json
{
  "aiAnnotatedImage": "https://presigned-url-valid-for-1-hour..."
}
```

This URL is generated fresh on every request with a 1-hour expiry.

---

## Testing with Postman — Complete Walkthrough

### Prerequisites

1. Backend running: `npm run dev`
2. Valid citizen JWT (from `POST /api/auth/login`)
3. At least one uploaded image (from `POST /api/upload`)
4. Reckoning HuggingFace Space is awake and running

### Step 1: Check AI Health

```
GET http://localhost:8000/api/ai/health
```

No auth needed. Confirm `Reckoning.online: true`.

### Step 2: Upload a Road Image

```
POST http://localhost:8000/api/upload
Authorization: Bearer {{citizen_token}}
Content-Type: multipart/form-data

Body → form-data:
  Key: file
  Value: <select an image with potholes/cracks>
```

Copy the `id` from the response → this is your `fileId`.

### Step 3: Run AI Detection

```
POST http://localhost:8000/api/ai/detect
Authorization: Bearer {{citizen_token}}
Content-Type: application/json

Body → raw JSON:
{
  "fileId": "{{media_id}}"
}
```

**Expected response:** Detection results + annotated image URL.

### Step 4: Download the Annotated Image

**In Postman:**
1. Copy the `annotatedImage.url` from Step 3 response
2. Paste it into a new browser tab → the annotated image downloads/displays
3. Or: Create a new GET request in Postman with that URL (no auth needed — it's a presigned S3 URL)

**What you'll see:** Your original road photo with colored bounding boxes drawn around detected defects, each labeled with the defect type and confidence score.

### Step 5: Re-download (after URL expires)

```
GET http://localhost:8000/api/ai/result/{{encoded_s3_key}}/download
Authorization: Bearer {{citizen_token}}
```

To encode the s3Key in Postman's Pre-request Script:
```javascript
const s3Key = pm.environment.get("annotated_s3_key");
const encoded = btoa(s3Key).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
pm.environment.set("encoded_s3_key", encoded);
```

### Step 6: View on Complaint

```
GET http://localhost:8000/api/complaints/{{complaint_id}}
Authorization: Bearer {{citizen_token}}
```

Check the `aiAnnotatedImage` field — it will be a presigned URL if AI detection was run.

### Postman Environment Variables

| Variable | Example Value | Source |
|----------|---------------|--------|
| `base_url` | `http://localhost:8000` | Manual |
| `citizen_token` | `eyJhbGciOi...` | From login response |
| `media_id` | `clxyz123abc...` | From upload response |
| `annotated_s3_key` | `ai-results/user123/2026/06/06/uuid.jpg` | From detect response `.annotatedImage.s3Key` |
| `encoded_s3_key` | `YWktcmVzdWx0cy...` | Base64url of above |
| `complaint_id` | `clxyz789...` | From create complaint response |

### Auto-capture in Postman Tests

On the **detect** request, add this to the Tests tab:
```javascript
const res = pm.response.json();
if (res.success && res.data.annotatedImage) {
  pm.environment.set("annotated_image_url", res.data.annotatedImage.url);
  pm.environment.set("annotated_s3_key", res.data.annotatedImage.s3Key);
  
  // Pre-encode for download endpoint
  const encoded = btoa(res.data.annotatedImage.s3Key)
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  pm.environment.set("encoded_s3_key", encoded);
}
```

---

## Annotated Image Details

### What's Drawn on the Image

The HuggingFace Space annotates the image with:

| Element | Description |
|---------|-------------|
| **Bounding boxes** | Rectangles around each detected defect |
| **Color coding** | Red = HIGH severity, Orange = MEDIUM, Green = LOW |
| **Labels** | Defect type above each box (e.g. "POTHOLE") |
| **Confidence** | Score displayed next to label (e.g. "91.3%") |
| **Semi-transparent overlay** | Highlights the defect region |

### S3 Storage

Annotated images are stored at:
```
ai-results/{userId}/{year}/{month}/{day}/{uuid}.jpg
```

- Private bucket (same as complaint photos)
- Only accessible via presigned URL
- Never publicly accessible
- Stored permanently (linked to complaint via `aiAnnotatedImageKey` column)

### URL Expiry

| Context | Expiry |
|---------|--------|
| From `POST /api/ai/detect` response | 24 hours |
| From `GET /api/ai/result/:key/download` | 24 hours |
| From `GET /api/complaints/:id` response | 1 hour |

After expiry, use the download endpoint to get a fresh URL.

---

## Error Responses

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | `fileId` missing or not a valid CUID |
| 401 | `NO_TOKEN` / `INVALID_TOKEN` | Missing or invalid auth token |
| 403 | `FORBIDDEN` | File/image belongs to a different user |
| 404 | `FILE_NOT_FOUND` | No media upload with that id |
| 422 | `UNSUPPORTED_FILE_TYPE` | File is video/audio, not an image |
| 422 | `FILE_ALREADY_LINKED` | File already attached to a complaint |
| 503 | `AI_UNAVAILABLE` | Reckoning API timeout or error |

---

## Environment Variables

Add to `.env`:

```env
RECKONING_API_URL=https://YOUR_USERNAME-reckoning.hf.space
RECKONING_API_SECRET=your_strong_secret_here
RECKONING_TIMEOUT_MS=30000
RECKONING_CONFIDENCE_THRESHOLD=0.40
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RECKONING_API_URL` | No* | — | HuggingFace Space URL |
| `RECKONING_API_SECRET` | No* | — | Shared secret for API auth |
| `RECKONING_TIMEOUT_MS` | No | `30000` | Timeout in ms |
| `RECKONING_CONFIDENCE_THRESHOLD` | No | `0.40` | Min confidence to include detection |

\* When unset, AI detection is skipped; app works normally without AI.

---

## File Structure

```
src/modules/ai/
├── ai.types.ts        — Interfaces (ReckoningResponse, AIDetectionResult, AnnotatedImagePayload)
├── ai.service.ts      — runReckoningDetection() + uploadAnnotatedImage() + checkReckoningHealth()
├── ai.controller.ts   — detectFromUpload + downloadAnnotatedResult + ReckoningHealth
├── ai.routes.ts       — POST /detect, GET /result/:s3Key/download, GET /health
└── ai.validation.ts   — Zod schemas

Modified:
├── src/config/env.ts                    — RECKONING_* env vars
├── src/services/s3.service.ts           — getFileBuffer() helper
├── src/server.ts                        — /api/ai router mount + startup health check
├── src/jobs/workers/aiAnalysis.worker.ts — Background Reckoning inference + S3 storage
├── src/modules/complaints/complaint.service.ts — stores aiAnnotatedImageKey on complaint
├── src/modules/complaints/complaint.types.ts   — aiAnnotatedImage in detail response
├── prisma/schema.prisma                 — aiAnnotatedImageKey column
└── .env.example                         — Documented env vars
```

---

## Detection Label Mapping

| Model Raw Label | Reckoning Category | Default Severity |
|-----------------|-------------------|------------------|
| `pothole` | `POTHOLE` | `HIGH` |
| `crack` | `CRACKS_DAMAGE` | `MEDIUM` |
| `faded_marking` | `FADED_LANE_MARKINGS` | `LOW` |
| `broken_sign` | `MISSING_BROKEN_SIGNBOARD` | `MEDIUM` |
| `poor_lighting` | `POOR_STREET_LIGHTING` | `MEDIUM` |
| `encroachment` | `ENCROACHMENT` | `HIGH` |
| `waterlogging` | `OTHERS` | `HIGH` |
| `debris` | `OTHERS` | `MEDIUM` |
| *(unknown)* | `OTHERS` | `LOW` |

To add new labels: update `DETECTION_MAP` in `src/modules/ai/ai.service.ts`.

---

## HuggingFace Space API Contract

### POST /detect

Accepts multipart form with `file` field. Must return:

```json
{
  "success": true,
  "totalDetected": 2,
  "inferenceMs": 1240,
  "primary": { "label": "pothole", "confidence": 0.91, "bbox": { "x1": 120, "y1": 340, "x2": 480, "y2": 620 } },
  "detections": [ ... ],
  "imageSize": { "width": 1920, "height": 1080 },
  "model": "yolov8n-roaddefects-v2",
  "annotatedImage": {
    "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "mimeType": "image/jpeg"
  }
}
```

`annotatedImage` is `null` when no detections found.

### GET /health

```json
{ "status": "ok", "model": "yolov8n-roaddefects-v2" }
```

### Authentication

Every request includes `x-api-secret` header.

---

## Background Worker

When a complaint is created, `ai-analysis` job runs in background:
1. Fetches first image linked to complaint
2. Runs Reckoning detection
3. Uploads annotated image to S3
4. Stores `aiDetected`, `aiCategory`, `aiConfidence`, `aiRawResult`, `aiAnnotatedImageKey` on complaint

Run standalone: `npm run worker:ai`

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| 503 AI_UNAVAILABLE | Space sleeping / network error | Wait for Space to wake, check URL |
| `annotatedImage: null` | Model returned no annotated image | Ensure Space annotation code is working |
| Expired download URL | Presigned URL past 24h | Call `GET /api/ai/result/:key/download` for fresh URL |
| 403 on download | Trying to access another user's image | S3 key must start with `ai-results/{your-userId}/` |
| No `aiAnnotatedImage` on complaint | AI ran before annotated image feature | Re-run detection or wait for background worker |
| Worker not processing | Redis not configured | Set `REDIS_URL` in `.env` |

---

## Security

- `POST /detect` requires citizen JWT — no anonymous AI calls
- File ownership verified before S3 fetch (prevents IDOR)
- Download endpoint verifies S3 key path belongs to requesting user
- Image buffers never logged
- Presigned URLs are time-limited (not permanent public access)
- AI suggestions are advisory only — citizen can always override
