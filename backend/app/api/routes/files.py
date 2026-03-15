"""app/api/routes/files.py — File storage and retrieval for courses using Supabase Storage"""
import io
import uuid
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Header, Query
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from app.db.supabase import get_supabase
from app.core.config import settings

# Document parsing imports
try:
    import PyPDF2
except ImportError:
    PyPDF2 = None

try:
    from docx import Document as DocxDocument
except ImportError:
    DocxDocument = None

try:
    from pptx import Presentation
except ImportError:
    Presentation = None


router = APIRouter()

# ── Pydantic Models ────────────────────────────────────────────

class FileMetadata(BaseModel):
    id: str
    course_id: str
    filename: str
    file_type: str
    size_bytes: int
    storage_path: str
    extracted_content: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class FileUploadResponse(BaseModel):
    success: bool
    file_id: str
    filename: str
    storage_path: str
    extracted_content_preview: Optional[str] = None
    message: str


class FileListResponse(BaseModel):
    files: List[FileMetadata]
    total_count: int


class FileContentResponse(BaseModel):
    file_id: str
    filename: str
    content: str
    file_type: str
    extracted_at: datetime


# ── Helper Functions ───────────────────────────────────────────

def get_user_from_token(authorization: Optional[str]) -> str:
    """Extract and verify user from JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization token")
    token = authorization.split(" ")[1]
    db = get_supabase()
    user = db.auth.get_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user.user.id


def extract_pdf_content(file_bytes: bytes) -> str:
    """Extract text content from PDF file."""
    if PyPDF2 is None:
        raise HTTPException(status_code=500, detail="PDF parsing not available. Install PyPDF2.")
    
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing PDF: {str(e)}")


def extract_docx_content(file_bytes: bytes) -> str:
    """Extract text content from DOCX file."""
    if DocxDocument is None:
        raise HTTPException(status_code=500, detail="DOCX parsing not available. Install python-docx.")
    
    try:
        doc = DocxDocument(io.BytesIO(file_bytes))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing DOCX: {str(e)}")


def extract_pptx_content(file_bytes: bytes) -> str:
    """Extract text content from PPTX file."""
    if Presentation is None:
        raise HTTPException(status_code=500, detail="PPTX parsing not available. Install python-pptx.")
    
    try:
        prs = Presentation(io.BytesIO(file_bytes))
        text_parts = []
        for slide_num, slide in enumerate(prs.slides, 1):
            slide_text = f"\n--- Slide {slide_num} ---\n"
            for shape in slide.shapes:
                if hasattr(shape, "text") and shape.text:
                    slide_text += shape.text + "\n"
            text_parts.append(slide_text)
        return "\n".join(text_parts).strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing PPTX: {str(e)}")


def extract_file_content(file_bytes: bytes, file_type: str) -> Optional[str]:
    """Extract text content based on file type."""
    file_type = file_type.lower()
    
    if file_type == "pdf" or file_type.endswith(".pdf"):
        return extract_pdf_content(file_bytes)
    elif file_type in ["docx", "doc"] or file_type.endswith(".docx"):
        return extract_docx_content(file_bytes)
    elif file_type in ["pptx", "ppt"] or file_type.endswith(".pptx"):
        return extract_pptx_content(file_bytes)
    
    return None


def get_file_extension(filename: str) -> str:
    """Get file extension from filename."""
    return filename.split(".")[-1].lower() if "." in filename else ""


# ── Endpoints ────────────────────────────────────────────────

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    course_id: str = Form(...),
    file: UploadFile = File(...),
    extract_content: bool = Form(True),
    authorization: Optional[str] = Header(None)
):
    """
    Upload a file to Supabase Storage for a specific course.
    Supports PDF, DOCX, and PPTX files with optional content extraction.
    """
    user_id = get_user_from_token(authorization)
    
    # Validate file type
    allowed_extensions = {"pdf", "docx", "pptx", "doc", "ppt"}
    file_ext = get_file_extension(file.filename)
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type: {file_ext}. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")
    
    if file_size > 50 * 1024 * 1024:  # 50MB limit
        raise HTTPException(status_code=400, detail="File size exceeds 50MB limit")
    
    # Generate unique file ID and storage path
    file_id = str(uuid.uuid4())
    storage_path = f"courses/{course_id}/{file_id}/{file.filename}"
    
    # Extract content if requested and file type supports it
    extracted_content = None
    content_preview = None
    
    if extract_content:
        try:
            extracted_content = extract_file_content(file_content, file_ext)
            if extracted_content:
                content_preview = extracted_content[:500] + "..." if len(extracted_content) > 500 else extracted_content
        except HTTPException:
            # Continue without content extraction if it fails
            pass
    
    # Upload to Supabase Storage
    db = get_supabase()
    try:
        storage_response = db.storage.from_("course-files").upload(
            path=storage_path,
            file=file_content,
            file_options={"content-type": file.content_type or "application/octet-stream"}
        )
    except Exception as e:
        # Create bucket if it doesn't exist
        try:
            db.storage.create_bucket("course-files", {"public": False})
            storage_response = db.storage.from_("course-files").upload(
                path=storage_path,
                file=file_content,
                file_options={"content-type": file.content_type or "application/octet-stream"}
            )
        except Exception as e2:
            raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e2)}")
    
    # Store metadata in database
    try:
        file_record = {
            "id": file_id,
            "course_id": course_id,
            "filename": file.filename,
            "file_type": file_ext,
            "size_bytes": file_size,
            "storage_path": storage_path,
            "extracted_content": extracted_content,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        db.table("course_files").insert(file_record).execute()
    except Exception as e:
        # If DB insert fails, try to delete the uploaded file
        try:
            db.storage.from_("course-files").remove([storage_path])
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Database insert failed: {str(e)}")
    
    return FileUploadResponse(
        success=True,
        file_id=file_id,
        filename=file.filename,
        storage_path=storage_path,
        extracted_content_preview=content_preview,
        message="File uploaded successfully"
    )


@router.get("/course/{course_id}", response_model=FileListResponse)
async def list_course_files(
    course_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    authorization: Optional[str] = Header(None)
):
    """List all files for a specific course."""
    user_id = get_user_from_token(authorization)
    
    db = get_supabase()
    
    try:
        response = db.table("course_files").select("*").eq("course_id", course_id).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        files = []
        for record in response.data:
            files.append(FileMetadata(
                id=record["id"],
                course_id=record["course_id"],
                filename=record["filename"],
                file_type=record["file_type"],
                size_bytes=record["size_bytes"],
                storage_path=record["storage_path"],
                extracted_content=record.get("extracted_content"),
                created_at=datetime.fromisoformat(record["created_at"].replace("Z", "+00:00")),
                updated_at=datetime.fromisoformat(record["updated_at"].replace("Z", "+00:00"))
            ))
        
        # Get total count
        count_response = db.table("course_files").select("id", count="exact").eq("course_id", course_id).execute()
        total_count = count_response.count if hasattr(count_response, 'count') else len(files)
        
        return FileListResponse(files=files, total_count=total_count)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")


@router.get("/{file_id}/content", response_model=FileContentResponse)
async def get_file_content(
    file_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Retrieve and extract content from a stored file.
    For PDF, DOCX, and PPTX files, returns extracted text content.
    """
    user_id = get_user_from_token(authorization)
    
    db = get_supabase()
    
    # Get file metadata
    try:
        response = db.table("course_files").select("*").eq("id", file_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="File not found")
        file_record = response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="File not found")
    
    # If content was already extracted and stored, return it
    if file_record.get("extracted_content"):
        return FileContentResponse(
            file_id=file_id,
            filename=file_record["filename"],
            content=file_record["extracted_content"],
            file_type=file_record["file_type"],
            extracted_at=datetime.fromisoformat(file_record["updated_at"].replace("Z", "+00:00"))
        )
    
    # Otherwise, download and extract content
    storage_path = file_record["storage_path"]
    file_ext = file_record["file_type"]
    
    try:
        file_bytes = db.storage.from_("course-files").download(storage_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")
    
    # Extract content
    try:
        content = extract_file_content(file_bytes, file_ext)
        if content is None:
            raise HTTPException(status_code=400, detail=f"Content extraction not supported for {file_ext} files")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content extraction failed: {str(e)}")
    
    # Update the database with extracted content
    try:
        db.table("course_files").update({
            "extracted_content": content,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", file_id).execute()
    except Exception:
        # Non-critical error, continue without updating
        pass
    
    return FileContentResponse(
        file_id=file_id,
        filename=file_record["filename"],
        content=content,
        file_type=file_record["file_type"],
        extracted_at=datetime.utcnow()
    )


@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    authorization: Optional[str] = Header(None)
):
    """Download a file directly from storage."""
    user_id = get_user_from_token(authorization)
    
    db = get_supabase()
    
    # Get file metadata
    try:
        response = db.table("course_files").select("*").eq("id", file_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="File not found")
        file_record = response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Download from storage
    storage_path = file_record["storage_path"]
    
    try:
        file_bytes = db.storage.from_("course-files").download(storage_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")
    
    # Determine content type
    content_type_map = {
        "pdf": "application/pdf",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "doc": "application/msword",
        "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "ppt": "application/vnd.ms-powerpoint"
    }
    content_type = content_type_map.get(file_record["file_type"], "application/octet-stream")
    
    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{file_record["filename"]}"'}
    )


@router.delete("/{file_id}")
async def delete_file(
    file_id: str,
    authorization: Optional[str] = Header(None)
):
    """Delete a file from storage and database."""
    user_id = get_user_from_token(authorization)
    
    db = get_supabase()
    
    # Get file metadata
    try:
        response = db.table("course_files").select("*").eq("id", file_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="File not found")
        file_record = response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="File not found")
    
    storage_path = file_record["storage_path"]
    
    # Delete from storage
    try:
        db.storage.from_("course-files").remove([storage_path])
    except Exception as e:
        # Continue even if storage delete fails (file might already be gone)
        pass
    
    # Delete from database
    try:
        db.table("course_files").delete().eq("id", file_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file record: {str(e)}")
    
    return JSONResponse(content={
        "success": True,
        "message": f"File '{file_record['filename']}' deleted successfully",
        "file_id": file_id
    })


@router.get("/{file_id}")
async def get_file_metadata(
    file_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get metadata for a specific file."""
    user_id = get_user_from_token(authorization)
    
    db = get_supabase()
    
    try:
        response = db.table("course_files").select("*").eq("id", file_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="File not found")
        file_record = response.data
        
        return FileMetadata(
            id=file_record["id"],
            course_id=file_record["course_id"],
            filename=file_record["filename"],
            file_type=file_record["file_type"],
            size_bytes=file_record["size_bytes"],
            storage_path=file_record["storage_path"],
            extracted_content=file_record.get("extracted_content"),
            created_at=datetime.fromisoformat(file_record["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(file_record["updated_at"].replace("Z", "+00:00"))
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=404, detail="File not found")


@router.post("/{file_id}/reextract")
async def reextract_content(
    file_id: str,
    authorization: Optional[str] = Header(None)
):
    """Re-extract content from a stored file (useful if extraction failed previously)."""
    user_id = get_user_from_token(authorization)
    
    db = get_supabase()
    
    # Get file metadata
    try:
        response = db.table("course_files").select("*").eq("id", file_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="File not found")
        file_record = response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="File not found")
    
    storage_path = file_record["storage_path"]
    file_ext = file_record["file_type"]
    
    # Download file
    try:
        file_bytes = db.storage.from_("course-files").download(storage_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")
    
    # Extract content
    try:
        content = extract_file_content(file_bytes, file_ext)
        if content is None:
            raise HTTPException(status_code=400, detail=f"Content extraction not supported for {file_ext} files")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content extraction failed: {str(e)}")
    
    # Update database
    try:
        db.table("course_files").update({
            "extracted_content": content,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", file_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update file record: {str(e)}")
    
    return FileContentResponse(
        file_id=file_id,
        filename=file_record["filename"],
        content=content,
        file_type=file_record["file_type"],
        extracted_at=datetime.utcnow()
    )
