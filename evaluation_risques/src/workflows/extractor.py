"""
extractor.py
============
Responsible for extracting raw text from any input document.
Currently supports:
  - PDF files (received as base64-encoded string)
  - Emails (received as plain text)
 
To add a new format (PPT, Word, etc.), just add a new activity
and call it from router.py — nothing else needs to change.
"""

import base64
import os
import tempfile

import mistralai.workflows as workflows

# --------------------------------##
# Main activity
# --------------------------------##


@workflows.activity()
async def extract_text(source_type: str, content: str) -> str:
    """Entry point for text extraction from pdf or email."""
    if source_type == "pdf":
        return await _extract_from_pdf(content)
    elif source_type == "email":
        return await _extract_from_email(content)
    else:
        return f"Unsupported source type: {source_type}"

# --------------------------------##
# Extract one per document type
# --------------------------------##


@workflows.activity()
async def _extract_from_pdf(content: str) -> str:
    """Decodes a base64 PDF and extracts its text using pdfplumber."""
    try:
        import pdfplumber

        # --- Step 1: Decode base64 > raw bytes ---
        pdf_bytes = base64.b64decode(content)

        # --- Step 2:  Write bytes to a temporary file on disk ---
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name

        # --- Step 3:  Open the temp file and extract text page by page ---
        text = ""
        with pdfplumber.open(tmp_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

        # --- Step 4:  Clean up the temp file ---
        os.unlink(tmp_path)

        return text if text else "No extractable text found in the PDF."
    
    except Exception as e:
        return f"PDF exctraction error: {e}"
    

@workflows.activity()
async def _extract_from_email(content: str) -> str:
    """Extract text in the email."""
    lines = content.splitlines()
    cleaned = "\n".join(
        line for line in lines
        if line.strip()  # keep only non-empty lines
    )
    return cleaned if cleaned else "Empty email content."


# ---------------------------------------------------------------------------
# How to add a new format (example: PPT)
# ---------------------------------------------------------------------------
#
# 1. Add a new activity here:
#
#    @workflows.activity()
#    async def _extract_from_ppt(content: str) -> str:
#        # decode base64 → .pptx file
#        # use python-pptx to extract slide text
#        ...
#
# 2. Add a new condition in extract_text():
#
#    elif source_type == "ppt":
#        return await _extract_from_ppt(content)
#
# Nothing else needs to change in the other files.
# ---------------------------------------------------------------------------