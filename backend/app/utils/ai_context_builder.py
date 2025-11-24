"""Build AI context from user's onboarding documents."""

from typing import List, Dict, Any, Optional
from uuid import UUID
import logging

from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class AIContextBuilder:
    """Build context from user documents for AI prompts."""
    
    def __init__(self):
        """Initialize with embedding service."""
        try:
            self.embedding_service = EmbeddingService()
        except Exception as e:
            logger.warning(f"Failed to initialize embedding service: {str(e)}")
            self.embedding_service = None
    
    def get_criteria_context(self, user_id: UUID, query: str, max_results: int = 3) -> str:
        """
        Get relevant criteria documents for AI prompt.
        
        Args:
            user_id: User's UUID
            query: Search query (e.g., "criteria for satellite antenna selection")
            max_results: Maximum number of document chunks to retrieve
            
        Returns:
            Formatted context string for AI prompt
        """
        if not self.embedding_service:
            return ""
        
        try:
            results = self.embedding_service.search_documents(
                user_id=user_id,
                query=query,
                doc_type="criteria",
                n_results=max_results
            )
            
            if not results:
                return ""
            
            context_parts = ["# User's Criteria Guidelines\n"]
            context_parts.append("The user has provided the following criteria-related documents:\n")
            
            for i, result in enumerate(results, 1):
                metadata = result.get("metadata", {})
                filename = metadata.get("filename", "Unknown")
                text = result.get("text", "")
                
                # Truncate very long texts
                if len(text) > 1000:
                    text = text[:1000] + "..."
                
                context_parts.append(f"\n## Document {i}: {filename}")
                context_parts.append(f"```\n{text}\n```\n")
            
            context_parts.append("\nPlease consider these guidelines when suggesting or evaluating criteria.")
            
            return "\n".join(context_parts)
        
        except Exception as e:
            logger.error(f"Failed to get criteria context for user {user_id}: {str(e)}")
            return ""
    
    def get_rating_context(self, user_id: UUID, query: str, max_results: int = 3) -> str:
        """
        Get relevant rating/scoring documents for AI prompt.
        
        Args:
            user_id: User's UUID
            query: Search query (e.g., "how to score components on power efficiency")
            max_results: Maximum number of document chunks to retrieve
            
        Returns:
            Formatted context string for AI prompt
        """
        if not self.embedding_service:
            return ""
        
        try:
            results = self.embedding_service.search_documents(
                user_id=user_id,
                query=query,
                doc_type="rating_doc",
                n_results=max_results
            )
            
            if not results:
                return ""
            
            context_parts = ["# User's Rating & Scoring Guidelines\n"]
            context_parts.append("The user has provided the following rating and scoring documents:\n")
            
            for i, result in enumerate(results, 1):
                metadata = result.get("metadata", {})
                filename = metadata.get("filename", "Unknown")
                text = result.get("text", "")
                
                # Truncate very long texts
                if len(text) > 1000:
                    text = text[:1000] + "..."
                
                context_parts.append(f"\n## Document {i}: {filename}")
                context_parts.append(f"```\n{text}\n```\n")
            
            context_parts.append("\nPlease follow similar rating methodologies and scoring approaches when evaluating components.")
            
            return "\n".join(context_parts)
        
        except Exception as e:
            logger.error(f"Failed to get rating context for user {user_id}: {str(e)}")
            return ""
    
    def get_report_context(self, user_id: UUID, query: str, max_results: int = 2) -> str:
        """
        Get relevant report templates for AI prompt.
        
        Args:
            user_id: User's UUID
            query: Search query (e.g., "trade study report structure")
            max_results: Maximum number of document chunks to retrieve
            
        Returns:
            Formatted context string for AI prompt
        """
        if not self.embedding_service:
            return ""
        
        try:
            results = self.embedding_service.search_documents(
                user_id=user_id,
                query=query,
                doc_type="report_template",
                n_results=max_results
            )
            
            if not results:
                return ""
            
            context_parts = ["# User's Report Format Guidelines\n"]
            context_parts.append("The user has provided the following report templates:\n")
            
            for i, result in enumerate(results, 1):
                metadata = result.get("metadata", {})
                filename = metadata.get("filename", "Unknown")
                text = result.get("text", "")
                
                # Truncate very long texts
                if len(text) > 1500:
                    text = text[:1500] + "..."
                
                context_parts.append(f"\n## Template {i}: {filename}")
                context_parts.append(f"```\n{text}\n```\n")
            
            context_parts.append("\nPlease structure the report in a similar format to these examples.")
            
            return "\n".join(context_parts)
        
        except Exception as e:
            logger.error(f"Failed to get report context for user {user_id}: {str(e)}")
            return ""
    
    def get_full_context(
        self, 
        user_id: UUID, 
        criteria_query: Optional[str] = None,
        rating_query: Optional[str] = None,
        report_query: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Get context from all document types.
        
        Args:
            user_id: User's UUID
            criteria_query: Query for criteria documents
            rating_query: Query for rating documents
            report_query: Query for report documents
            
        Returns:
            Dictionary with context for each type
        """
        context = {}
        
        if criteria_query:
            criteria_ctx = self.get_criteria_context(user_id, criteria_query)
            if criteria_ctx:
                context["criteria"] = criteria_ctx
        
        if rating_query:
            rating_ctx = self.get_rating_context(user_id, rating_query)
            if rating_ctx:
                context["rating"] = rating_ctx
        
        if report_query:
            report_ctx = self.get_report_context(user_id, report_query)
            if report_ctx:
                context["report"] = report_ctx
        
        return context
    
    def build_augmented_prompt(
        self, 
        base_prompt: str,
        user_id: UUID,
        context_queries: Dict[str, str]
    ) -> str:
        """
        Build an augmented prompt with user context.
        
        Args:
            base_prompt: The original prompt
            user_id: User's UUID
            context_queries: Dict mapping context type to query
                            e.g., {"criteria": "selection criteria for antennas"}
            
        Returns:
            Augmented prompt with user context prepended
        """
        context_parts = []
        
        # Get relevant contexts
        if "criteria" in context_queries:
            ctx = self.get_criteria_context(user_id, context_queries["criteria"])
            if ctx:
                context_parts.append(ctx)
        
        if "rating" in context_queries:
            ctx = self.get_rating_context(user_id, context_queries["rating"])
            if ctx:
                context_parts.append(ctx)
        
        if "report" in context_queries:
            ctx = self.get_report_context(user_id, context_queries["report"])
            if ctx:
                context_parts.append(ctx)
        
        # Combine context with base prompt
        if not context_parts:
            return base_prompt
        
        augmented_prompt = "\n\n".join(context_parts)
        augmented_prompt += "\n\n---\n\n"
        augmented_prompt += base_prompt
        
        return augmented_prompt

