#!/usr/bin/env python3
"""
Azure OpenAI Chat Completions Example
=====================================

This script demonstrates how to build conversational AI applications using
Azure OpenAI Service's Chat Completions API. It includes both streaming and
non-streaming implementations with conversation memory.

Features:
- Non-streaming chat completions
- Streaming chat completions with real-time display
- Conversation memory management
- Configurable system prompts
- Comprehensive error handling
- Token usage tracking
- Interactive chat interface

Requirements:
- Azure OpenAI Service endpoint and API key
- openai>=1.0.0
- python-dotenv
"""

import os
import sys
import asyncio
import logging
from typing import List, Dict, Optional, AsyncGenerator
from datetime import datetime
import json

try:
    from openai import AsyncAzureOpenAI
    from dotenv import load_dotenv
except ImportError as e:
    print(f"Error importing required packages: {e}")
    print("Please install required packages:")
    print("pip install openai>=1.0.0 python-dotenv")
    sys.exit(1)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ChatConfiguration:
    """Configuration class for chat parameters."""
    
    def __init__(self):
        self.temperature = 0.7
        self.max_tokens = 1000
        self.top_p = 0.95
        self.frequency_penalty = 0.0
        self.presence_penalty = 0.0
        self.system_prompt = (
            "You are a helpful, knowledgeable assistant specializing in Azure AI services. "
            "You provide accurate, practical information and always maintain a friendly, "
            "professional tone. Keep responses concise but comprehensive, and ask clarifying "
            "questions when needed to provide the best help possible."
        )

class ConversationManager:
    """Manages conversation history and context."""
    
    def __init__(self, system_prompt: str, max_history: int = 10):
        self.messages: List[Dict[str, str]] = [
            {"role": "system", "content": system_prompt}
        ]
        self.max_history = max_history
        self.total_tokens = 0
    
    def add_user_message(self, content: str):
        """Add a user message to the conversation."""
        self.messages.append({"role": "user", "content": content})
        self._trim_history()
    
    def add_assistant_message(self, content: str):
        """Add an assistant message to the conversation."""
        self.messages.append({"role": "assistant", "content": content})
        self._trim_history()
    
    def _trim_history(self):
        """Trim conversation history to maintain context window."""
        # Keep system message + max_history messages
        if len(self.messages) > self.max_history + 1:
            # Keep system message and recent messages
            self.messages = [self.messages[0]] + self.messages[-(self.max_history):]
    
    def get_messages(self) -> List[Dict[str, str]]:
        """Get current conversation messages."""
        return self.messages.copy()
    
    def update_token_count(self, tokens: int):
        """Update total token count."""
        self.total_tokens += tokens
    
    def get_conversation_summary(self) -> str:
        """Get a summary of the conversation."""
        user_messages = len([m for m in self.messages if m["role"] == "user"])
        assistant_messages = len([m for m in self.messages if m["role"] == "assistant"])
        return f"Messages: {user_messages} user, {assistant_messages} assistant | Total tokens: {self.total_tokens}"

class AzureChatClient:
    """Azure OpenAI Chat Client with streaming and non-streaming support."""
    
    def __init__(self):
        self.client = self._initialize_client()
        self.deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
        
        if not self.deployment_name:
            raise ValueError("AZURE_OPENAI_DEPLOYMENT_NAME environment variable is required")
    
    def _initialize_client(self) -> AsyncAzureOpenAI:
        """Initialize the Azure OpenAI client."""
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        api_key = os.getenv("AZURE_OPENAI_API_KEY")
        api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-10-21")
        
        if not endpoint or not api_key:
            raise ValueError(
                "AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY environment variables are required"
            )
        
        return AsyncAzureOpenAI(
            azure_endpoint=endpoint,
            api_key=api_key,
            api_version=api_version
        )
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        config: ChatConfiguration
    ) -> Dict:
        """
        Get a non-streaming chat completion.
        
        Args:
            messages: List of conversation messages
            config: Chat configuration parameters
            
        Returns:
            Dictionary containing response and usage information
        """
        try:
            logger.info(f"Sending non-streaming chat request with {len(messages)} messages")
            
            response = await self.client.chat.completions.create(
                model=self.deployment_name,
                messages=messages,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                top_p=config.top_p,
                frequency_penalty=config.frequency_penalty,
                presence_penalty=config.presence_penalty
            )
            
            return {
                "content": response.choices[0].message.content,
                "role": response.choices[0].message.role,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                },
                "finish_reason": response.choices[0].finish_reason
            }
            
        except Exception as e:
            logger.error(f"Error in chat completion: {e}")
            raise
    
    async def stream_chat_completion(
        self,
        messages: List[Dict[str, str]],
        config: ChatConfiguration
    ) -> AsyncGenerator[Dict, None]:
        """
        Get a streaming chat completion.
        
        Args:
            messages: List of conversation messages
            config: Chat configuration parameters
            
        Yields:
            Dictionary containing response chunks and usage information
        """
        try:
            logger.info(f"Starting streaming chat request with {len(messages)} messages")
            
            response = await self.client.chat.completions.create(
                model=self.deployment_name,
                messages=messages,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                top_p=config.top_p,
                frequency_penalty=config.frequency_penalty,
                presence_penalty=config.presence_penalty,
                stream=True,
                stream_options={"include_usage": True}
            )
            
            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield {
                        "content": chunk.choices[0].delta.content,
                        "role": "assistant",
                        "finish_reason": chunk.choices[0].finish_reason
                    }
                
                # Handle usage information in streaming
                if hasattr(chunk, 'usage') and chunk.usage:
                    yield {
                        "usage": {
                            "prompt_tokens": chunk.usage.prompt_tokens,
                            "completion_tokens": chunk.usage.completion_tokens,
                            "total_tokens": chunk.usage.total_tokens
                        }
                    }
                    
        except Exception as e:
            logger.error(f"Error in streaming chat completion: {e}")
            raise

class InteractiveChatApp:
    """Interactive chat application with both streaming and non-streaming modes."""
    
    def __init__(self):
        self.client = AzureChatClient()
        self.config = ChatConfiguration()
        self.conversation = ConversationManager(self.config.system_prompt)
        self.streaming_mode = True
    
    def display_welcome(self):
        """Display welcome message and instructions."""
        print("\n" + "="*60)
        print("🤖 Azure OpenAI Chat Assistant")
        print("="*60)
        print("Commands:")
        print("  /help     - Show this help message")
        print("  /config   - Show current configuration")
        print("  /stream   - Toggle streaming mode")
        print("  /clear    - Clear conversation history")
        print("  /stats    - Show conversation statistics")
        print("  /quit     - Exit the application")
        print("="*60)
        print(f"Mode: {'Streaming' if self.streaming_mode else 'Non-streaming'}")
        print("Type your message and press Enter to start chatting!\n")
    
    def display_config(self):
        """Display current configuration."""
        print("\n📋 Current Configuration:")
        print(f"  Temperature: {self.config.temperature}")
        print(f"  Max Tokens: {self.config.max_tokens}")
        print(f"  Top P: {self.config.top_p}")
        print(f"  Frequency Penalty: {self.config.frequency_penalty}")
        print(f"  Presence Penalty: {self.config.presence_penalty}")
        print(f"  Streaming Mode: {self.streaming_mode}")
        print(f"  System Prompt: {self.config.system_prompt[:100]}...")
        print()
    
    async def handle_streaming_response(self, user_input: str):
        """Handle streaming chat response."""
        self.conversation.add_user_message(user_input)
        
        print("🤖 Assistant: ", end="", flush=True)
        
        full_response = ""
        usage_info = None
        
        try:
            async for chunk in self.client.stream_chat_completion(
                self.conversation.get_messages(),
                self.config
            ):
                if "content" in chunk:
                    content = chunk["content"]
                    print(content, end="", flush=True)
                    full_response += content
                
                if "usage" in chunk:
                    usage_info = chunk["usage"]
            
            print()  # New line after streaming
            
            # Add assistant response to conversation
            if full_response:
                self.conversation.add_assistant_message(full_response)
            
            # Update token count
            if usage_info:
                self.conversation.update_token_count(usage_info["total_tokens"])
                print(f"💡 Tokens used: {usage_info['total_tokens']} "
                      f"(prompt: {usage_info['prompt_tokens']}, "
                      f"completion: {usage_info['completion_tokens']})")
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
            logger.error(f"Streaming error: {e}")
    
    async def handle_non_streaming_response(self, user_input: str):
        """Handle non-streaming chat response."""
        self.conversation.add_user_message(user_input)
        
        print("🤖 Assistant: Thinking...")
        
        try:
            response = await self.client.chat_completion(
                self.conversation.get_messages(),
                self.config
            )
            
            print(f"🤖 Assistant: {response['content']}")
            
            # Add assistant response to conversation
            self.conversation.add_assistant_message(response['content'])
            
            # Update token count
            self.conversation.update_token_count(response['usage']['total_tokens'])
            print(f"💡 Tokens used: {response['usage']['total_tokens']} "
                  f"(prompt: {response['usage']['prompt_tokens']}, "
                  f"completion: {response['usage']['completion_tokens']})")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            logger.error(f"Non-streaming error: {e}")
    
    async def run(self):
        """Run the interactive chat application."""
        self.display_welcome()
        
        while True:
            try:
                user_input = input("👤 You: ").strip()
                
                if not user_input:
                    continue
                
                # Handle commands
                if user_input.startswith('/'):
                    if user_input == '/help':
                        self.display_welcome()
                    elif user_input == '/config':
                        self.display_config()
                    elif user_input == '/stream':
                        self.streaming_mode = not self.streaming_mode
                        print(f"🔄 Switched to {'streaming' if self.streaming_mode else 'non-streaming'} mode")
                    elif user_input == '/clear':
                        self.conversation = ConversationManager(self.config.system_prompt)
                        print("🗑️  Conversation history cleared")
                    elif user_input == '/stats':
                        print(f"📊 {self.conversation.get_conversation_summary()}")
                    elif user_input == '/quit':
                        print("👋 Goodbye!")
                        break
                    else:
                        print("❓ Unknown command. Type /help for available commands.")
                    continue
                
                # Handle chat messages
                if self.streaming_mode:
                    await self.handle_streaming_response(user_input)
                else:
                    await self.handle_non_streaming_response(user_input)
                
                print()  # Add spacing between messages
                
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"❌ Unexpected error: {e}")
                logger.error(f"Unexpected error: {e}")

async def demonstrate_chat_features():
    """Demonstrate various chat features programmatically."""
    print("🚀 Demonstrating Azure OpenAI Chat Features")
    print("="*50)
    
    try:
        client = AzureChatClient()
        config = ChatConfiguration()
        conversation = ConversationManager(config.system_prompt)
        
        # Test non-streaming chat
        print("\n1. Non-streaming Chat Example:")
        print("-" * 30)
        
        conversation.add_user_message("What are the main benefits of using Azure OpenAI Service?")
        
        response = await client.chat_completion(
            conversation.get_messages(),
            config
        )
        
        print(f"User: What are the main benefits of using Azure OpenAI Service?")
        print(f"Assistant: {response['content']}")
        print(f"Tokens: {response['usage']['total_tokens']}")
        
        conversation.add_assistant_message(response['content'])
        conversation.update_token_count(response['usage']['total_tokens'])
        
        # Test streaming chat
        print("\n2. Streaming Chat Example:")
        print("-" * 30)
        
        conversation.add_user_message("Can you explain how chat completions work?")
        
        print("User: Can you explain how chat completions work?")
        print("Assistant: ", end="", flush=True)
        
        full_response = ""
        async for chunk in client.stream_chat_completion(
            conversation.get_messages(),
            config
        ):
            if "content" in chunk:
                content = chunk["content"]
                print(content, end="", flush=True)
                full_response += content
            elif "usage" in chunk:
                print(f"\nTokens: {chunk['usage']['total_tokens']}")
        
        if full_response:
            conversation.add_assistant_message(full_response)
        
        print(f"\n\n3. Conversation Summary:")
        print("-" * 30)
        print(conversation.get_conversation_summary())
        
    except Exception as e:
        print(f"❌ Demo error: {e}")
        logger.error(f"Demo error: {e}")

def main():
    """Main function to run the chat application."""
    print("Azure OpenAI Chat Application")
    print("Choose mode:")
    print("1. Interactive Chat")
    print("2. Feature Demo")
    
    try:
        choice = input("Enter choice (1 or 2): ").strip()
        
        if choice == "1":
            app = InteractiveChatApp()
            asyncio.run(app.run())
        elif choice == "2":
            asyncio.run(demonstrate_chat_features())
        else:
            print("Invalid choice. Please run the script again.")
    
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Application error: {e}")
        logger.error(f"Application error: {e}")

if __name__ == "__main__":
    main() 