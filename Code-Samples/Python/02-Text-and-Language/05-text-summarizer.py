#!/usr/bin/env python3
"""
Azure AI Language Text Summarizer
Comprehensive implementation with extractive, abstractive, and conversation summarization
"""

import os
import asyncio
import time
import json
import logging
from typing import List, Dict, Optional, Union, Any
from dataclasses import dataclass
from datetime import datetime
import aiohttp
import requests
from azure.ai.textanalytics import TextAnalyticsClient
from azure.ai.textanalytics.models import (
    ExtractiveSummaryAction, 
    AbstractiveSummaryAction,
    AnalyzeActionsOperation
)
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import AzureError, HttpResponseError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class SummaryResult:
    """Data class for summarization results"""
    summary_type: str
    summary_text: str
    sentences: List[str] = None
    rank_scores: List[float] = None
    processing_time: float = 0.0
    character_count: int = 0
    confidence_score: float = 0.0

@dataclass
class ConversationSummary:
    """Data class for conversation summarization results"""
    issue: str = ""
    resolution: str = ""
    recap: str = ""
    chapter_titles: List[str] = None
    narrative_summaries: List[str] = None

class AzureTextSummarizer:
    """Comprehensive Azure AI Language Text Summarizer"""
    
    def __init__(self, endpoint: str = None, api_key: str = None):
        """Initialize the text summarizer"""
        self.endpoint = endpoint or os.getenv('AZURE_LANGUAGE_ENDPOINT')
        self.api_key = api_key or os.getenv('AZURE_LANGUAGE_KEY')
        
        if not self.endpoint or not self.api_key:
            raise ValueError("Azure Language endpoint and API key are required")
        
        # Initialize Azure Text Analytics client
        self.credential = AzureKeyCredential(self.api_key)
        self.client = TextAnalyticsClient(
            endpoint=self.endpoint, 
            credential=self.credential
        )
        
        # Configuration
        self.max_retries = 3
        self.retry_delay = 1.0
        self.rate_limit_delay = 2.0
        
        # Statistics tracking
        self.stats = {
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'total_characters_processed': 0,
            'average_processing_time': 0.0
        }
        
        logger.info("Azure Text Summarizer initialized successfully")

    async def extractive_summarization(
        self, 
        text: str, 
        sentence_count: int = 3,
        sort_by: str = "Rank"
    ) -> SummaryResult:
        """
        Perform extractive summarization
        
        Args:
            text: Input text to summarize
            sentence_count: Number of sentences to extract (1-20)
            sort_by: Sort order - "Rank" or "Offset"
        """
        start_time = time.time()
        
        try:
            # Validate inputs
            if not text or len(text.strip()) == 0:
                raise ValueError("Input text cannot be empty")
            
            if not 1 <= sentence_count <= 20:
                raise ValueError("Sentence count must be between 1 and 20")
            
            # Create extractive summary action
            extractive_action = ExtractiveSummaryAction(
                max_sentence_count=sentence_count,
                sort_by=sort_by
            )
            
            # Process with retry logic
            for attempt in range(self.max_retries):
                try:
                    # Start analysis
                    poller = self.client.begin_analyze_actions(
                        [text],
                        actions=[extractive_action]
                    )
                    
                    # Wait for completion
                    result = poller.result()
                    
                    # Extract results
                    for action_result in result:
                        extractive_results = action_result.extract_summary_results
                        
                        for doc_result in extractive_results:
                            if doc_result.is_error:
                                raise Exception(f"Analysis error: {doc_result.error.message}")
                            
                            # Build result
                            sentences = [sentence.text for sentence in doc_result.sentences]
                            rank_scores = [sentence.rank_score for sentence in doc_result.sentences]
                            
                            processing_time = time.time() - start_time
                            
                            # Update statistics
                            self._update_stats(len(text), processing_time, True)
                            
                            return SummaryResult(
                                summary_type="extractive",
                                summary_text=" ".join(sentences),
                                sentences=sentences,
                                rank_scores=rank_scores,
                                processing_time=processing_time,
                                character_count=len(text)
                            )
                    
                    break
                    
                except HttpResponseError as e:
                    if e.status_code == 429:  # Rate limit
                        logger.warning(f"Rate limit hit, attempt {attempt + 1}")
                        await asyncio.sleep(self.rate_limit_delay * (2 ** attempt))
                    else:
                        raise
                except Exception as e:
                    if attempt == self.max_retries - 1:
                        raise
                    logger.warning(f"Attempt {attempt + 1} failed: {str(e)}")
                    await asyncio.sleep(self.retry_delay * (2 ** attempt))
            
        except Exception as e:
            processing_time = time.time() - start_time
            self._update_stats(len(text), processing_time, False)
            logger.error(f"Extractive summarization failed: {str(e)}")
            raise

    async def abstractive_summarization(
        self, 
        text: str, 
        summary_length: str = "medium"
    ) -> SummaryResult:
        """
        Perform abstractive summarization
        
        Args:
            text: Input text to summarize
            summary_length: Length of summary - "short", "medium", "long"
        """
        start_time = time.time()
        
        try:
            # Validate inputs
            if not text or len(text.strip()) == 0:
                raise ValueError("Input text cannot be empty")
            
            if summary_length not in ["short", "medium", "long"]:
                raise ValueError("Summary length must be 'short', 'medium', or 'long'")
            
            # Create abstractive summary action
            abstractive_action = AbstractiveSummaryAction(
                summary_length=summary_length
            )
            
            # Process with retry logic
            for attempt in range(self.max_retries):
                try:
                    # Start analysis
                    poller = self.client.begin_analyze_actions(
                        [text],
                        actions=[abstractive_action]
                    )
                    
                    # Wait for completion
                    result = poller.result()
                    
                    # Extract results
                    for action_result in result:
                        abstractive_results = action_result.abstractive_summary_results
                        
                        for doc_result in abstractive_results:
                            if doc_result.is_error:
                                raise Exception(f"Analysis error: {doc_result.error.message}")
                            
                            # Build result
                            summaries = [summary.text for summary in doc_result.summaries]
                            summary_text = " ".join(summaries)
                            
                            processing_time = time.time() - start_time
                            
                            # Update statistics
                            self._update_stats(len(text), processing_time, True)
                            
                            return SummaryResult(
                                summary_type="abstractive",
                                summary_text=summary_text,
                                processing_time=processing_time,
                                character_count=len(text)
                            )
                    
                    break
                    
                except HttpResponseError as e:
                    if e.status_code == 429:  # Rate limit
                        logger.warning(f"Rate limit hit, attempt {attempt + 1}")
                        await asyncio.sleep(self.rate_limit_delay * (2 ** attempt))
                    else:
                        raise
                except Exception as e:
                    if attempt == self.max_retries - 1:
                        raise
                    logger.warning(f"Attempt {attempt + 1} failed: {str(e)}")
                    await asyncio.sleep(self.retry_delay * (2 ** attempt))
            
        except Exception as e:
            processing_time = time.time() - start_time
            self._update_stats(len(text), processing_time, False)
            logger.error(f"Abstractive summarization failed: {str(e)}")
            raise

    async def conversation_summarization(
        self, 
        conversation_items: List[Dict[str, str]],
        summary_aspects: List[str] = None
    ) -> ConversationSummary:
        """
        Perform conversation summarization
        
        Args:
            conversation_items: List of conversation items with 'text', 'role', 'participantId'
            summary_aspects: List of aspects to summarize ["issue", "resolution", "recap", "chapterTitle", "narrative"]
        """
        start_time = time.time()
        
        try:
            if not conversation_items:
                raise ValueError("Conversation items cannot be empty")
            
            if summary_aspects is None:
                summary_aspects = ["issue", "resolution", "recap"]
            
            # Prepare conversation data
            conversation_data = {
                "displayName": "Conversation Summarization",
                "analysisInput": {
                    "conversations": [{
                        "conversationItems": [
                            {
                                "text": item["text"],
                                "id": str(i + 1),
                                "role": item.get("role", "Customer"),
                                "participantId": item.get("participantId", f"Participant_{i + 1}")
                            }
                            for i, item in enumerate(conversation_items)
                        ],
                        "modality": "text",
                        "id": "conversation1",
                        "language": "en"
                    }]
                },
                "tasks": [
                    {
                        "taskName": f"{aspect}_task",
                        "kind": "ConversationalSummarizationTask",
                        "parameters": {"summaryAspects": [aspect]}
                    }
                    for aspect in summary_aspects
                ]
            }
            
            # Make REST API call for conversation summarization
            headers = {
                "Content-Type": "application/json",
                "Ocp-Apim-Subscription-Key": self.api_key
            }
            
            url = f"{self.endpoint}/language/analyze-conversations/jobs?api-version=2023-04-01"
            
            # Process with retry logic
            for attempt in range(self.max_retries):
                try:
                    # Submit job
                    response = requests.post(url, headers=headers, json=conversation_data)
                    response.raise_for_status()
                    
                    # Get operation location
                    operation_location = response.headers.get("operation-location")
                    if not operation_location:
                        raise Exception("No operation location in response")
                    
                    # Poll for results
                    while True:
                        result_response = requests.get(operation_location, headers=headers)
                        result_response.raise_for_status()
                        result_data = result_response.json()
                        
                        if result_data["status"] == "succeeded":
                            break
                        elif result_data["status"] == "failed":
                            raise Exception("Conversation analysis failed")
                        
                        await asyncio.sleep(2)  # Wait before polling again
                    
                    # Parse results
                    conversation_summary = ConversationSummary()
                    
                    for task in result_data["tasks"]["items"]:
                        if task["status"] == "succeeded":
                            conversations = task["results"]["conversations"]
                            for conv in conversations:
                                for summary in conv["summaries"]:
                                    aspect = summary["aspect"]
                                    text = summary["text"]
                                    
                                    if aspect == "issue":
                                        conversation_summary.issue = text
                                    elif aspect == "resolution":
                                        conversation_summary.resolution = text
                                    elif aspect == "recap":
                                        conversation_summary.recap = text
                                    elif aspect == "chapterTitle":
                                        if conversation_summary.chapter_titles is None:
                                            conversation_summary.chapter_titles = []
                                        conversation_summary.chapter_titles.append(text)
                                    elif aspect == "narrative":
                                        if conversation_summary.narrative_summaries is None:
                                            conversation_summary.narrative_summaries = []
                                        conversation_summary.narrative_summaries.append(text)
                    
                    processing_time = time.time() - start_time
                    total_chars = sum(len(item["text"]) for item in conversation_items)
                    self._update_stats(total_chars, processing_time, True)
                    
                    return conversation_summary
                    
                except requests.exceptions.HTTPError as e:
                    if e.response.status_code == 429:  # Rate limit
                        logger.warning(f"Rate limit hit, attempt {attempt + 1}")
                        await asyncio.sleep(self.rate_limit_delay * (2 ** attempt))
                    else:
                        raise
                except Exception as e:
                    if attempt == self.max_retries - 1:
                        raise
                    logger.warning(f"Attempt {attempt + 1} failed: {str(e)}")
                    await asyncio.sleep(self.retry_delay * (2 ** attempt))
            
        except Exception as e:
            processing_time = time.time() - start_time
            total_chars = sum(len(item["text"]) for item in conversation_items)
            self._update_stats(total_chars, processing_time, False)
            logger.error(f"Conversation summarization failed: {str(e)}")
            raise

    async def batch_summarization(
        self, 
        documents: List[str], 
        summarization_type: str = "extractive",
        **kwargs
    ) -> List[SummaryResult]:
        """
        Process multiple documents in batch
        
        Args:
            documents: List of text documents
            summarization_type: "extractive" or "abstractive"
            **kwargs: Additional parameters for summarization
        """
        results = []
        
        # Process documents with concurrency control
        semaphore = asyncio.Semaphore(5)  # Limit concurrent requests
        
        async def process_document(doc):
            async with semaphore:
                try:
                    if summarization_type == "extractive":
                        return await self.extractive_summarization(doc, **kwargs)
                    else:
                        return await self.abstractive_summarization(doc, **kwargs)
                except Exception as e:
                    logger.error(f"Failed to process document: {str(e)}")
                    return None
        
        # Process all documents concurrently
        tasks = [process_document(doc) for doc in documents]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out failed results
        successful_results = [r for r in results if isinstance(r, SummaryResult)]
        
        logger.info(f"Batch processing completed: {len(successful_results)}/{len(documents)} successful")
        
        return successful_results

    def _update_stats(self, character_count: int, processing_time: float, success: bool):
        """Update processing statistics"""
        self.stats['total_requests'] += 1
        self.stats['total_characters_processed'] += character_count
        
        if success:
            self.stats['successful_requests'] += 1
        else:
            self.stats['failed_requests'] += 1
        
        # Update average processing time
        total_time = self.stats['average_processing_time'] * (self.stats['total_requests'] - 1)
        self.stats['average_processing_time'] = (total_time + processing_time) / self.stats['total_requests']

    def get_statistics(self) -> Dict[str, Any]:
        """Get processing statistics"""
        success_rate = 0.0
        if self.stats['total_requests'] > 0:
            success_rate = self.stats['successful_requests'] / self.stats['total_requests'] * 100
        
        return {
            **self.stats,
            'success_rate_percent': round(success_rate, 2),
            'estimated_cost_usd': self._estimate_cost()
        }

    def _estimate_cost(self) -> float:
        """Estimate processing cost based on character usage"""
        # Approximate pricing: $2 per 1M characters for standard tier
        text_records = self.stats['total_characters_processed'] / 1000
        estimated_cost = text_records * 0.002  # $2 per 1000 text records
        return round(estimated_cost, 4)

    def save_summary_history(self, filename: str = None):
        """Save summary processing history"""
        if filename is None:
            filename = f"summary_history_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        history_data = {
            'timestamp': datetime.now().isoformat(),
            'statistics': self.get_statistics(),
            'configuration': {
                'endpoint': self.endpoint,
                'max_retries': self.max_retries,
                'retry_delay': self.retry_delay,
                'rate_limit_delay': self.rate_limit_delay
            }
        }
        
        with open(filename, 'w') as f:
            json.dump(history_data, f, indent=2)
        
        logger.info(f"Summary history saved to {filename}")

class InteractiveSummarizer:
    """Interactive command-line interface for text summarization"""
    
    def __init__(self):
        self.summarizer = AzureTextSummarizer()
        self.running = True

    async def run(self):
        """Run the interactive summarizer"""
        print("\n🤖 Azure AI Text Summarizer")
        print("=" * 50)
        print("Choose an option:")
        print("1. Extractive Summarization")
        print("2. Abstractive Summarization")
        print("3. Conversation Summarization")
        print("4. Batch Processing")
        print("5. View Statistics")
        print("6. Exit")
        
        while self.running:
            try:
                choice = input("\nEnter your choice (1-6): ").strip()
                
                if choice == "1":
                    await self._extractive_mode()
                elif choice == "2":
                    await self._abstractive_mode()
                elif choice == "3":
                    await self._conversation_mode()
                elif choice == "4":
                    await self._batch_mode()
                elif choice == "5":
                    self._show_statistics()
                elif choice == "6":
                    self.running = False
                    print("Thank you for using Azure AI Text Summarizer!")
                else:
                    print("Invalid choice. Please try again.")
                    
            except KeyboardInterrupt:
                print("\nExiting...")
                self.running = False
            except Exception as e:
                print(f"Error: {str(e)}")

    async def _extractive_mode(self):
        """Interactive extractive summarization"""
        print("\n📄 Extractive Summarization")
        print("-" * 30)
        
        text = input("Enter text to summarize: ").strip()
        if not text:
            print("Text cannot be empty.")
            return
        
        try:
            sentence_count = int(input("Number of sentences (1-20, default 3): ") or "3")
            sort_by = input("Sort by (Rank/Offset, default Rank): ") or "Rank"
            
            print("\nProcessing...")
            result = await self.summarizer.extractive_summarization(
                text, sentence_count, sort_by
            )
            
            print(f"\n✅ Extractive Summary:")
            print(f"Summary: {result.summary_text}")
            print(f"Processing time: {result.processing_time:.2f}s")
            print(f"Character count: {result.character_count}")
            
            if result.sentences:
                print(f"\nExtracted sentences:")
                for i, (sentence, score) in enumerate(zip(result.sentences, result.rank_scores), 1):
                    print(f"{i}. {sentence} (Score: {score:.3f})")
                    
        except ValueError as e:
            print(f"Invalid input: {str(e)}")
        except Exception as e:
            print(f"Summarization failed: {str(e)}")

    async def _abstractive_mode(self):
        """Interactive abstractive summarization"""
        print("\n📝 Abstractive Summarization")
        print("-" * 30)
        
        text = input("Enter text to summarize: ").strip()
        if not text:
            print("Text cannot be empty.")
            return
        
        try:
            length = input("Summary length (short/medium/long, default medium): ") or "medium"
            
            print("\nProcessing...")
            result = await self.summarizer.abstractive_summarization(text, length)
            
            print(f"\n✅ Abstractive Summary:")
            print(f"Summary: {result.summary_text}")
            print(f"Processing time: {result.processing_time:.2f}s")
            print(f"Character count: {result.character_count}")
            
        except Exception as e:
            print(f"Summarization failed: {str(e)}")

    async def _conversation_mode(self):
        """Interactive conversation summarization"""
        print("\n💬 Conversation Summarization")
        print("-" * 30)
        
        conversation_items = []
        
        print("Enter conversation (type 'done' when finished):")
        while True:
            speaker = input("Speaker (Agent/Customer): ").strip()
            if speaker.lower() == 'done':
                break
            
            text = input("Text: ").strip()
            if not text:
                continue
            
            conversation_items.append({
                "text": text,
                "role": speaker,
                "participantId": f"{speaker}_1"
            })
        
        if not conversation_items:
            print("No conversation items entered.")
            return
        
        try:
            print("\nProcessing...")
            result = await self.summarizer.conversation_summarization(conversation_items)
            
            print(f"\n✅ Conversation Summary:")
            if result.issue:
                print(f"Issue: {result.issue}")
            if result.resolution:
                print(f"Resolution: {result.resolution}")
            if result.recap:
                print(f"Recap: {result.recap}")
            
        except Exception as e:
            print(f"Conversation summarization failed: {str(e)}")

    async def _batch_mode(self):
        """Interactive batch processing"""
        print("\n📚 Batch Processing")
        print("-" * 30)
        
        documents = []
        print("Enter documents to summarize (type 'done' when finished):")
        
        i = 1
        while True:
            text = input(f"Document {i}: ").strip()
            if text.lower() == 'done':
                break
            if text:
                documents.append(text)
                i += 1
        
        if not documents:
            print("No documents entered.")
            return
        
        try:
            summarization_type = input("Summarization type (extractive/abstractive, default extractive): ") or "extractive"
            
            print(f"\nProcessing {len(documents)} documents...")
            results = await self.summarizer.batch_summarization(documents, summarization_type)
            
            print(f"\n✅ Batch Processing Results:")
            for i, result in enumerate(results, 1):
                if result:
                    print(f"\nDocument {i}:")
                    print(f"Summary: {result.summary_text[:200]}...")
                    print(f"Processing time: {result.processing_time:.2f}s")
            
        except Exception as e:
            print(f"Batch processing failed: {str(e)}")

    def _show_statistics(self):
        """Show processing statistics"""
        print("\n📊 Processing Statistics")
        print("-" * 30)
        
        stats = self.summarizer.get_statistics()
        
        print(f"Total requests: {stats['total_requests']}")
        print(f"Successful requests: {stats['successful_requests']}")
        print(f"Failed requests: {stats['failed_requests']}")
        print(f"Success rate: {stats['success_rate_percent']}%")
        print(f"Total characters processed: {stats['total_characters_processed']:,}")
        print(f"Average processing time: {stats['average_processing_time']:.2f}s")
        print(f"Estimated cost: ${stats['estimated_cost_usd']}")

async def main():
    """Main function to run the interactive summarizer"""
    print("Initializing Azure AI Text Summarizer...")
    
    try:
        # Check environment variables
        if not os.getenv('AZURE_LANGUAGE_ENDPOINT') or not os.getenv('AZURE_LANGUAGE_KEY'):
            print("Error: Please set AZURE_LANGUAGE_ENDPOINT and AZURE_LANGUAGE_KEY environment variables")
            return
        
        # Run interactive summarizer
        interactive = InteractiveSummarizer()
        await interactive.run()
        
    except Exception as e:
        print(f"Failed to initialize: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main()) 