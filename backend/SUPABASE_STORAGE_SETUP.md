# Supabase Storage Implementation Guide for INTOIT Learning

This guide covers the setup and implementation of file storage using Supabase Storage for course materials.

## Overview

The file storage system supports:
- **PDF** documents
- **DOCX** Word documents  
- **PPTX** PowerPoint presentations

Files are stored in Supabase Storage, with metadata and extracted text content stored in the PostgreSQL database for AI context.

---

## 1. Database Schema Setup

Run this SQL in your Supabase SQL Editor to create the `course_files` table:

```sql
-- Course Files (file storage metadata)
create table if not exists public.course_files (
  id            uuid primary key default uuid_generate_v4(),
  course_id     text not null references public.courses(course_id) on delete cascade,
  filename      text not null,
  file_type     text not null,
  size_bytes    integer not null,
  storage_path  text not null unique,
  extracted_content text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- RLS for course files
alter table public.course_files enable row level security;
create policy "Everyone can view course files" on public.course_files for select using (true);
create policy "Authenticated users can upload course files" on public.course_files for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update course files" on public.course_files for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete course files" on public.course_files for delete using (auth.role() = 'authenticated');

-- Trigger for course_files updated_at
create trigger course_files_updated_at before update on public.course_files
  for each row execute procedure public.set_updated_at();

-- Indexes for course files
create index if not exists idx_course_files_course_id on public.course_files(course_id);
create index if not exists idx_course_files_file_type on public.course_files(file_type);
```

---

## 2. Supabase Storage Bucket Setup

### Option A: Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Storage** → **Buckets**
3. Click **New Bucket**
4. Name: `course-files`
5. Uncheck "Public bucket" (files should be private)
6. Click **Create bucket**

### Option B: Via SQL (using storage admin)

```sql
-- Create the storage bucket (requires service role or admin)
-- Note: This must be run with appropriate permissions
insert into storage.buckets (id, name, public)
values ('course-files', 'course-files', false);
```

---

## 3. Storage Policies

Set up these policies for the `course-files` bucket in Supabase Dashboard (Storage → Policies):

### Select Policy (Download)
```sql
(bucket_id = 'course-files'::text)
```

### Insert Policy (Upload)
```sql
(bucket_id = 'course-files'::text) AND (auth.role() = 'authenticated')
```

### Delete Policy
```sql
(bucket_id = 'course-files'::text) AND (auth.role() = 'authenticated')
```

---

## 4. Python Dependencies

Add these to `requirements.txt`:

```
PyPDF2           # PDF text extraction
python-docx      # DOCX text extraction  
python-pptx      # PPTX text extraction
python-multipart # File upload handling
```

Install:
```bash
pip install PyPDF2 python-docx python-pptx python-multipart
```

---

## 5. Environment Variables

Ensure your `.env` file includes:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

**Important:** Use the **service role key** (not anon key) for server-side storage operations.

---

## 6. API Endpoints

All endpoints require `Authorization: Bearer <jwt_token>` header.

### Upload File
```http
POST /api/files/upload
Content-Type: multipart/form-data

course_id: string (required)
file: File (required) - PDF, DOCX, or PPTX
extract_content: boolean (optional, default: true)
```

**Response:**
```json
{
  "success": true,
  "file_id": "uuid",
  "filename": "lecture.pdf",
  "storage_path": "courses/course-123/uuid/lecture.pdf",
  "extracted_content_preview": "First 500 chars of extracted text...",
  "message": "File uploaded successfully"
}
```

### List Course Files
```http
GET /api/files/course/{course_id}?limit=50&offset=0
```

### Get File Metadata
```http
GET /api/files/{file_id}
```

### Get Extracted Content
```http
GET /api/files/{file_id}/content
```

**Response:**
```json
{
  "file_id": "uuid",
  "filename": "lecture.pdf",
  "content": "Full extracted text content...",
  "file_type": "pdf",
  "extracted_at": "2026-03-15T10:30:00Z"
}
```

### Download File
```http
GET /api/files/{file_id}/download
```

Returns the raw file with appropriate Content-Type header.

### Re-extract Content
```http
POST /api/files/{file_id}/reextract
```

Useful if initial extraction failed or you need to reprocess.

### Delete File
```http
DELETE /api/files/{file_id}
```

---

## 7. AI Context Integration

Extracted content is stored in the `extracted_content` column and can be used for AI learning context:

```python
# Example: Get all content for a course
supabase.table("course_files") \
    .select("filename, extracted_content") \
    .eq("course_id", course_id) \
    .execute()
```

This content can be fed into your AI (Gemini/Claude) to provide context about course materials.

---

## 8. File Size Limits

- **Maximum file size:** 50MB per file
- **Storage path format:** `courses/{course_id}/{file_id}/{filename}`

---

## 9. Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "Storage upload failed" | Bucket doesn't exist | Create `course-files` bucket in Supabase |
| "PDF parsing not available" | PyPDF2 not installed | Run `pip install PyPDF2` |
| "Content extraction not supported" | Unknown file type | Only PDF, DOCX, PPTX supported |
| "File size exceeds 50MB" | File too large | Compress file or split into parts |

---

## 10. Security Considerations

1. **JWT Token Required** — All endpoints verify the Bearer token
2. **RLS Policies** — Database policies restrict access to authenticated users
3. **Private Bucket** — Files are not publicly accessible; must use download endpoint
4. **Course Association** — Files are linked to courses via foreign key

---

## Quick Start Checklist

- [ ] Create `course-files` bucket in Supabase Storage
- [ ] Run SQL schema to create `course_files` table
- [ ] Set up storage policies in Supabase Dashboard
- [ ] Install Python dependencies (`PyPDF2`, `python-docx`, `python-pptx`)
- [ ] Verify `SUPABASE_SERVICE_KEY` is in `.env`
- [ ] Test upload endpoint with a sample PDF
- [ ] Verify content extraction works
- [ ] Test download and delete endpoints
