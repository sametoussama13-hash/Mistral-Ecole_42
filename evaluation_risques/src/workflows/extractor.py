"""
extractor.py
============
Extracts raw text from PDF, email, or Excel.
Excel is read directly with pandas — no truncation.
"""

import base64
import os
import re
import tempfile

import mistralai.workflows as wfk


@wfk.activity()
async def extract_text(source_type: str, content: str) -> str:
    """Entry point for text extraction."""
    if source_type == "pdf":
        return await _extract_from_pdf(content)
    elif source_type == "email":
        return await _extract_from_email(content)
    elif source_type == "excel":
        return await _extract_from_excel(content)
    else:
        return f"Unsupported source type: {source_type}"


@wfk.activity()
async def _extract_from_pdf(content: str) -> str:
    """Decodes a base64 PDF and extracts its text using pdfplumber."""
    try:
        import pdfplumber
        pdf_bytes = base64.b64decode(content)
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name
        text = ""
        with pdfplumber.open(tmp_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        os.unlink(tmp_path)
        return text if text else "No extractable text found in the PDF."
    except Exception as e:
        return f"PDF extraction error: {e}"


@wfk.activity()
async def _extract_from_email(content: str) -> str:
    """Cleans and returns plain text email content."""
    lines = content.splitlines()
    cleaned = "\n".join(line for line in lines if line.strip())
    return cleaned if cleaned else "Empty email content."


@wfk.activity()
async def _extract_from_excel(content: str) -> str:
    """
    Reads Excel directly with pandas — no truncation.
    Returns tab-separated lines: ID \\t Question \\t Response
    """
    try:
        import io
        import pandas as pd

        # Decode base64 → bytes (keep in memory, no temp file needed)
        excel_bytes = base64.b64decode(content)
        excel_buffer = io.BytesIO(excel_bytes)

        # Read raw without header to detect structure
        df_raw = pd.read_excel(excel_buffer, header=None)

        # Find the header row containing "Question" or "Description"
        header_row = None
        for i, row in df_raw.iterrows():
            row_str = " ".join(str(v).lower() for v in row if pd.notna(v))
            if "question" in row_str or "description" in row_str:
                header_row = i
                break

        if header_row is None:
            # No header found — return raw text
            return df_raw.to_string(index=False)

        # Get data rows (everything after the header)
        data_rows = df_raw.iloc[header_row + 1:].reset_index(drop=True)

        # Build tab-separated output: ID \t Question \t Response
        lines = []
        for _, row in data_rows.iterrows():
            vals = [str(v).strip() if pd.notna(v) else "" for v in row]

            # Need at least 3 columns
            if len(vals) < 3:
                continue

            qid = vals[0].replace("*", "").strip()
            question = vals[1].strip()
            response = vals[2].strip()

            # Only keep rows with a valid question ID (e.g. "2.1 AAC-01")
            if not re.match(r"^\d+\.\d+", qid):
                continue
            if not question:
                continue

            lines.append(f"{qid}\t{question}\t{response}")

        if not lines:
            return "No questions found in Excel file."

        return "\n".join(lines)

    except Exception as e:
        return f"Excel extraction error: {e}"