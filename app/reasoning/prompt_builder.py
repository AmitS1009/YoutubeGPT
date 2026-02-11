from typing import List
from langchain_core.documents import Document
from app.config.prompts import ANSWER_GENERATOR_SYSTEM_PROMPT

class PromptBuilder:
    @staticmethod
    def build_system_message() -> str:
        return ANSWER_GENERATOR_SYSTEM_PROMPT

    @staticmethod
    def build_context_string(documents: List) -> str:
        """
        Formats documents into a context string with metadata.
        Filters out exact duplicate contents to prevent LLM stutter.
        """
        context_parts = []
        seen_content = set()
        
        for i, doc in enumerate(documents):
            # Normalization for dedupe
            # Handle both dict (PDF) and Document (Vector) objects
            if isinstance(doc, dict):
                 page_content = doc.get("text", doc.get("page_content", ""))
                 metadata = doc.get("metadata", doc)
            else:
                 page_content = getattr(doc, "page_content", "")
                 metadata = getattr(doc, "metadata", {})

            clean_content = page_content.strip()
            if clean_content in seen_content:
                continue
            seen_content.add(clean_content)

            # Format: [ID] (Time: MM:SS) Content...
            # metadata keys vary: 'start' (YouTube), 'window_start_time' (some ingest), 'start_time' etc.
            start_time = metadata.get('start', metadata.get('window_start_time', metadata.get('start_time', None)))
            
            timestamp = ""
            if start_time is not None:
                try:
                    s_float = float(start_time)
                    minutes = int(s_float // 60)
                    seconds = int(s_float % 60)
                    timestamp = f"{minutes:02d}:{seconds:02d}"
                except:
                    timestamp = str(start_time)
            
            citation = f"(Start: {timestamp})" if timestamp else f"(Chunk {i+1})"
            
            content = f"Chunk {i+1} {citation}:\n{page_content}\n"
            context_parts.append(content)
            
        return "\n".join(context_parts)
