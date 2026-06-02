"""
ingestion.py
=============
Agent 1 - Ingestion Parsing + Translation
Responsible for normalizing all incoming data:
  - Questionnaire TPRA
  - Vendor responses
  - Attachments
  - Vendor metadata
  - Language detection and translation
"""

import json
import os
from datetime import datetime
from typing import Optional

import mistralai.workflows as workflows
from pydantic import BaseModel, Field


# --------------------------------##
# Data models
# --------------------------------##

class VendorInput(BaseModel):
    """Input vendor data."""
    name: str
    country: Optional[str] = None
    industry: Optional[str] = None


class QuestionInput(BaseModel):
    """Input question data."""
    question_id: str
    topic: Optional[str] = None
    question: str
    answer: str


class AttachmentInput(BaseModel):
    """Input attachment data."""
    attachment_id: str
    filename: str
    content: Optional[str] = None  # base64 encoded content


class TPRAIngestionInput(BaseModel):
    """Complete input for Agent 1."""
    vendor: VendorInput
    questions: list[QuestionInput]
    attachments: list[AttachmentInput]


class NormalizedVendor(BaseModel):
    """Normalized vendor output."""
    name: str
    country: Optional[str] = None
    industry: Optional[str] = None
    assessment_date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))


class NormalizedQuestion(BaseModel):
    """Normalized question with translation."""
    question_id: str
    topic: Optional[str] = None
    question: str
    answer_original: str
    answer_translated: Optional[str] = None
    answer_en: Optional[str] = None
    answer_fr: Optional[str] = None
    detected_language: str = "en"


class NormalizedAttachment(BaseModel):
    """Normalized attachment metadata."""
    attachment_id: str
    filename: str
    file_type: str
    file_size: Optional[int] = None
    is_valid: bool = True


class IngestionOutput(BaseModel):
    """Complete output from Agent 1."""
    vendor: NormalizedVendor
    normalized_questions: list[NormalizedQuestion]
    normalized_attachments: list[NormalizedAttachment]


# --------------------------------##
# Activities
# --------------------------------##

@workflows.activity()
async def detect_language(text: str) -> str:
    """Detect the language of a text using Mistral API."""
    from mistralai.client import Mistral

    client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

    prompt = f"""
Detect the language of the following text and respond ONLY with the ISO 639-1 language code (2 letters):

Text: {text[:500]}

Respond with only the 2-letter code (e.g., "en", "fr", "de", "es").
"""

    response = client.chat.complete(
        model="mistral-large-latest",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
    )

    language_code = response.choices[0].message.content.strip().lower()
    # Ensure we return a valid 2-letter code
    valid_codes = ["en", "fr", "de", "es", "it", "nl", "pt", "pl", "ru", "zh", "ja"]
    if language_code in valid_codes:
        return language_code
    return "en"  # Default to English if detection fails


@workflows.activity()
async def translate_text(text: str, target_language: str, source_language: Optional[str] = None) -> str:
    """Translate text to target language using Mistral API."""
    from mistralai.client import Mistral

    client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

    if source_language:
        prompt = f"""Translate the following text from {source_language} to {target_language}.
Preserve technical terms and maintain the original meaning.

Text to translate:
{text}

Provide only the translated text, without any additional explanations or formatting."""
    else:
        prompt = f"""Translate the following text to {target_language}.
Preserve technical terms and maintain the original meaning.

Text to translate:
{text}

Provide only the translated text, without any additional explanations or formatting."""

    response = client.chat.complete(
        model="mistral-large-latest",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )

    return response.choices[0].message.content.strip()


@workflows.activity()
async def normalize_attachment(attachment: AttachmentInput) -> NormalizedAttachment:
    """Normalize attachment metadata."""
    import base64

    filename = attachment.filename.lower()

    # Extract file type from filename
    file_type = "unknown"
    if ".pdf" in filename:
        file_type = "pdf"
    elif ".png" in filename:
        file_type = "png"
    elif ".jpg" in filename or ".jpeg" in filename:
        file_type = "jpg"
    elif ".doc" in filename or ".docx" in filename:
        file_type = "doc"
    elif ".xls" in filename or ".xlsx" in filename:
        file_type = "xls"
    elif ".txt" in filename:
        file_type = "txt"
    elif ".csv" in filename:
        file_type = "csv"
    elif ".eml" in filename:
        file_type = "eml"

    # Calculate file size if content is provided
    file_size = None
    if attachment.content:
        try:
            decoded = base64.b64decode(attachment.content)
            file_size = len(decoded)
        except Exception:
            file_size = None

    return NormalizedAttachment(
        attachment_id=attachment.attachment_id,
        filename=attachment.filename,
        file_type=file_type,
        file_size=file_size,
        is_valid=bool(file_type != "unknown")
    )


@workflows.activity()
async def normalize_question(question: QuestionInput) -> NormalizedQuestion:
    """Normalize a single question and its answer."""
    # Detect language of the answer
    detected_language = await detect_language(question.answer)

    # Translate to French and English if needed
    answer_translated = None
    answer_fr = None
    answer_en = None

    if detected_language != "fr":
        answer_fr = await translate_text(question.answer, "fr", detected_language)
    else:
        answer_fr = question.answer

    if detected_language != "en":
        answer_en = await translate_text(question.answer, "en", detected_language)
    else:
        answer_en = question.answer

    # Set translated answer to French by default
    answer_translated = answer_fr

    return NormalizedQuestion(
        question_id=question.question_id,
        topic=question.topic,
        question=question.question,
        answer_original=question.answer,
        answer_translated=answer_translated,
        answer_en=answer_en,
        answer_fr=answer_fr,
        detected_language=detected_language
    )


@workflows.activity()
async def ingest_data(input_data: TPRAIngestionInput) -> IngestionOutput:
    """
    Main Agent 1 activity: Normalize all incoming TPRA data.
    
    This is the entry point for Agent 1 - Ingestion Parsing + Translation.
    It normalizes:
      - Vendor metadata
      - Questions and answers (with language detection and translation)
      - Attachments metadata
    """
    # Normalize vendor
    normalized_vendor = NormalizedVendor(
        name=input_data.vendor.name,
        country=input_data.vendor.country,
        industry=input_data.vendor.industry
    )

    # Normalize questions in parallel
    normalized_questions = []
    for question in input_data.questions:
        normalized_question = await normalize_question(question)
        normalized_questions.append(normalized_question)

    # Normalize attachments in parallel
    normalized_attachments = []
    for attachment in input_data.attachments:
        normalized_attachment = await normalize_attachment(attachment)
        normalized_attachments.append(normalized_attachment)

    return IngestionOutput(
        vendor=normalized_vendor,
        normalized_questions=normalized_questions,
        normalized_attachments=normalized_attachments
    )


# --------------------------------##
# Batch processing for multiple questions
# --------------------------------##

@workflows.activity()
async def normalize_questions_batch(questions: list[QuestionInput]) -> list[NormalizedQuestion]:
    """Normalize a batch of questions for better performance."""
    normalized = []
    for question in questions:
        normalized_question = await normalize_question(question)
        normalized.append(normalized_question)
    return normalized


@workflows.activity()
async def normalize_attachments_batch(attachments: list[AttachmentInput]) -> list[NormalizedAttachment]:
    """Normalize a batch of attachments for better performance."""
    normalized = []
    for attachment in attachments:
        normalized_attachment = await normalize_attachment(attachment)
        normalized.append(normalized_attachment)
    return normalized
