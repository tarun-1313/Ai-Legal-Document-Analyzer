"""
OCR & Text Extraction Service
Extracts text from PDF documents using PyPDF2 (native PDFs) and
falls back to Tesseract OCR for scanned documents.
"""

from typing import Tuple, List
from PyPDF2 import PdfReader

# Optional OCR imports – graceful fallback if not installed
try:
    import pytesseract
    from pdf2image import convert_from_path
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False


def extract_text_from_pdf(file_path: str) -> Tuple[str, int]:
    """
    Extract text from a PDF file with enhanced cleanup and OCR fallback.
    """
    import re
    
    reader = PdfReader(file_path)
    page_count = len(reader.pages)
    
    # ── Attempt 1: Native text extraction ──
    pages_text = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        # Basic cleanup: remove multiple spaces, normalize newlines
        text = re.sub(r' +', ' ', text)
        pages_text.append(f"--- Page {i + 1} ---\n{text}")
    
    full_text = "\n\n".join(pages_text)
    
    # Improved check: if text is too short OR seems to be garbage (e.g. very few vowels)
    vowels = len(re.findall(r'[aeiouAEIOU]', full_text))
    is_mostly_garbage = len(full_text) > 0 and (vowels / len(full_text)) < 0.1
    
    if len(full_text.strip()) > 500 and not is_mostly_garbage:
        return full_text, page_count
    
    # ── Attempt 2: OCR fallback for scanned PDFs ──
    if OCR_AVAILABLE:
        print(f"📸 PDF '{file_path}' appears scanned or unreadable — running OCR...")
        try:
            images = convert_from_path(file_path, dpi=300)
            ocr_pages = []
            for i, image in enumerate(images):
                text = pytesseract.image_to_string(image)
                text = re.sub(r' +', ' ', text)
                ocr_pages.append(f"--- Page {i + 1} (OCR) ---\n{text}")
            full_text = "\n\n".join(ocr_pages)
        except Exception as e:
            print(f"⚠️ OCR failed for {file_path}: {e}")
    
    return full_text, page_count


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """
    Split extracted text into overlapping chunks for embedding.
    
    Optimized for legal documents:
    1. Splits on major document sections (Articles, Sections).
    2. Splits on double newlines (paragraphs).
    3. Splits on single newlines.
    4. Finally splits on sentences.
    
    Args:
        text: The full document text.
        chunk_size: Target number of characters per chunk.
        overlap: Number of overlapping characters between chunks.
    
    Returns:
        List of text chunks.
    """
    if not text or len(text.strip()) == 0:
        return []
    
    import re
    
    # ── Step 1: Split into semantic sections if possible ──
    # Regex to find common legal section markers like "ARTICLE I", "Section 2.1", etc.
    section_markers = [
        r"\n\s*(?:ARTICLE|Article|Section|SECTION)\s+[IVX0-9]+(?:\.[0-9]+)*",
        r"\n\s*[0-9]+\.\s+[A-Z][a-z]+", # "1. Definitions"
    ]
    
    sections = [text]
    for marker in section_markers:
        new_sections = []
        for section in sections:
            split_points = [m.start() for m in re.finditer(marker, section)]
            if not split_points:
                new_sections.append(section)
                continue
            
            last_pos = 0
            for pos in split_points:
                if pos > last_pos:
                    new_sections.append(section[last_pos:pos])
                last_pos = pos
            new_sections.append(section[last_pos:])
        sections = new_sections

    # ── Step 2: Further split large sections into chunks ──
    final_chunks = []
    for section in sections:
        if len(section) <= chunk_size:
            if section.strip():
                final_chunks.append(section.strip())
            continue
            
        # Split by paragraph
        paragraphs = section.split("\n\n")
        current_chunk = ""
        
        for p in paragraphs:
            if len(current_chunk) + len(p) < chunk_size:
                current_chunk += p + "\n\n"
            else:
                if current_chunk:
                    final_chunks.append(current_chunk.strip())
                
                # If paragraph itself is too large, split it by sentences
                if len(p) > chunk_size:
                    sentences = re.split(r"(?<=[.!?])\s+", p)
                    temp_chunk = ""
                    for s in sentences:
                        if len(temp_chunk) + len(s) < chunk_size:
                            temp_chunk += s + " "
                        else:
                            if temp_chunk:
                                final_chunks.append(temp_chunk.strip())
                            # Handle case where a single sentence is still too large
                            if len(s) > chunk_size:
                                # Force split by characters as a last resort
                                for i in range(0, len(s), chunk_size - overlap):
                                    final_chunks.append(s[i:i + chunk_size])
                                temp_chunk = ""
                            else:
                                temp_chunk = s + " "
                    current_chunk = temp_chunk
                else:
                    current_chunk = p + "\n\n"
        
        if current_chunk:
            final_chunks.append(current_chunk.strip())
            
    # Remove very small chunks that might be noise
    return [c for c in final_chunks if len(c) > 50]

