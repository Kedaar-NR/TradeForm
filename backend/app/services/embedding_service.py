"""Service for generating and managing embeddings using ChromaDB."""

import chromadb
from chromadb.utils import embedding_functions
import os
from typing import List, Dict, Any, Optional
from uuid import UUID
import logging

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for managing document embeddings using ChromaDB with Gemini."""
    
    def __init__(self):
        """Initialize ChromaDB client with Gemini embeddings."""
        try:
            # Initialize ChromaDB client (persistent storage)
            self.client = chromadb.PersistentClient(path="./chroma_db")
            
            # Use Gemini for embeddings if available
            gemini_api_key = os.getenv("GEMINI_API_KEY")
            if gemini_api_key:
                try:
                    self.embedding_fn = embedding_functions.GoogleGenerativeAiEmbeddingFunction(
                        api_key=gemini_api_key,
                        model_name="models/embedding-001"
                    )
                    logger.info("Initialized ChromaDB with Gemini embeddings")
                except Exception as e:
                    logger.warning(f"Failed to initialize Gemini embeddings, using default: {str(e)}")
                    self.embedding_fn = embedding_functions.DefaultEmbeddingFunction()
            else:
                logger.warning("GEMINI_API_KEY not set, using default embedding function")
                self.embedding_fn = embedding_functions.DefaultEmbeddingFunction()
        
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {str(e)}")
            raise
    
    def create_user_collection(self, user_id: UUID) -> str:
        """
        Create or get a ChromaDB collection for a user.
        
        Args:
            user_id: User's UUID
            
        Returns:
            Collection name
        """
        collection_name = f"user_{str(user_id).replace('-', '_')}"
        
        try:
            # Get or create collection
            collection = self.client.get_or_create_collection(
                name=collection_name,
                embedding_function=self.embedding_fn,
                metadata={"user_id": str(user_id)}
            )
            logger.info(f"Created/retrieved collection: {collection_name}")
            return collection_name
        
        except Exception as e:
            logger.error(f"Failed to create collection for user {user_id}: {str(e)}")
            raise
    
    def add_document(
        self, 
        user_id: UUID, 
        doc_id: str, 
        text: str, 
        metadata: Dict[str, Any]
    ) -> str:
        """
        Add document embeddings to user's collection.
        
        Args:
            user_id: User's UUID
            doc_id: Document ID (should be unique)
            text: Document text content
            metadata: Document metadata (type, filename, etc.)
            
        Returns:
            Document ID that was added
        """
        try:
            collection_name = self.create_user_collection(user_id)
            collection = self.client.get_collection(name=collection_name)
            
            # Split text into chunks if it's too long (max ~8000 chars per chunk)
            chunks = self._chunk_text(text, max_chunk_size=8000)
            
            # Add each chunk with a unique ID
            for i, chunk in enumerate(chunks):
                chunk_id = f"{doc_id}_chunk_{i}"
                chunk_metadata = {
                    **metadata,
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "doc_id": doc_id
                }
                
                collection.add(
                    ids=[chunk_id],
                    documents=[chunk],
                    metadatas=[chunk_metadata]
                )
            
            logger.info(f"Added document {doc_id} with {len(chunks)} chunks to collection")
            return doc_id
        
        except Exception as e:
            logger.error(f"Failed to add document {doc_id}: {str(e)}")
            raise
    
    def search_documents(
        self, 
        user_id: UUID, 
        query: str, 
        doc_type: Optional[str] = None, 
        n_results: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search user's documents by semantic similarity.
        
        Args:
            user_id: User's UUID
            query: Search query
            doc_type: Optional document type filter (criteria, rating_doc, report_template)
            n_results: Number of results to return
            
        Returns:
            List of matching document chunks with metadata
        """
        try:
            collection_name = f"user_{str(user_id).replace('-', '_')}"
            
            try:
                collection = self.client.get_collection(name=collection_name)
            except Exception:
                logger.warning(f"Collection {collection_name} does not exist")
                return []
            
            # Build where clause for filtering
            where_clause = None
            if doc_type:
                where_clause = {"type": doc_type}
            
            # Query the collection
            results = collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where_clause
            )
            
            # Format results
            formatted_results = []
            if results and results['ids'] and len(results['ids']) > 0:
                for i in range(len(results['ids'][0])):
                    formatted_results.append({
                        "id": results['ids'][0][i],
                        "text": results['documents'][0][i] if results['documents'] else "",
                        "metadata": results['metadatas'][0][i] if results['metadatas'] else {},
                        "distance": results['distances'][0][i] if results.get('distances') else None
                    })
            
            logger.info(f"Found {len(formatted_results)} results for query in collection {collection_name}")
            return formatted_results
        
        except Exception as e:
            logger.error(f"Failed to search documents for user {user_id}: {str(e)}")
            return []
    
    def delete_document(self, user_id: UUID, doc_id: str):
        """
        Remove document from collection.
        
        Args:
            user_id: User's UUID
            doc_id: Document ID to delete
        """
        try:
            collection_name = f"user_{str(user_id).replace('-', '_')}"
            
            try:
                collection = self.client.get_collection(name=collection_name)
            except Exception:
                logger.warning(f"Collection {collection_name} does not exist")
                return
            
            # Get all chunk IDs for this document
            results = collection.get(
                where={"doc_id": doc_id}
            )
            
            if results and results['ids']:
                collection.delete(ids=results['ids'])
                logger.info(f"Deleted document {doc_id} and its {len(results['ids'])} chunks")
            else:
                logger.warning(f"No chunks found for document {doc_id}")
        
        except Exception as e:
            logger.error(f"Failed to delete document {doc_id}: {str(e)}")
            raise
    
    def get_collection_stats(self, user_id: UUID) -> Dict[str, Any]:
        """
        Get statistics about a user's collection.
        
        Args:
            user_id: User's UUID
            
        Returns:
            Dictionary with collection statistics
        """
        try:
            collection_name = f"user_{str(user_id).replace('-', '_')}"
            
            try:
                collection = self.client.get_collection(name=collection_name)
                count = collection.count()
                
                return {
                    "collection_name": collection_name,
                    "total_chunks": count,
                    "exists": True
                }
            except Exception:
                return {
                    "collection_name": collection_name,
                    "total_chunks": 0,
                    "exists": False
                }
        
        except Exception as e:
            logger.error(f"Failed to get collection stats for user {user_id}: {str(e)}")
            return {
                "collection_name": None,
                "total_chunks": 0,
                "exists": False,
                "error": str(e)
            }
    
    @staticmethod
    def _chunk_text(text: str, max_chunk_size: int = 8000) -> List[str]:
        """
        Split text into chunks for embedding.
        
        Args:
            text: Text to chunk
            max_chunk_size: Maximum characters per chunk
            
        Returns:
            List of text chunks
        """
        if len(text) <= max_chunk_size:
            return [text]
        
        chunks = []
        current_pos = 0
        
        while current_pos < len(text):
            # Get chunk
            chunk = text[current_pos:current_pos + max_chunk_size]
            
            # Try to break at a sentence or paragraph boundary
            if current_pos + max_chunk_size < len(text):
                # Look for good break points (period, newline)
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n\n')
                
                break_point = max(last_period, last_newline)
                if break_point > max_chunk_size * 0.7:  # Only break if we're far enough
                    chunk = chunk[:break_point + 1]
            
            chunks.append(chunk.strip())
            current_pos += len(chunk)
        
        return [c for c in chunks if c]  # Filter empty chunks

