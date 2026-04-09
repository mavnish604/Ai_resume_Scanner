import os
from typing import Any, List, Optional
from dotenv import load_dotenv
load_dotenv()
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import BaseMessage, AIMessage
from langchain_core.outputs import ChatResult, ChatGeneration
from sarvamai import SarvamAI

class CustomSarvamChat(BaseChatModel):
    """A custom LangChain wrapper that correctly passes the model parameter."""
    api_subscription_key: str
    model: str 

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[Any] = None,
        **kwargs: Any,
    ) -> ChatResult:
        
        client = SarvamAI(api_subscription_key=self.api_subscription_key)
        
        # 1. Convert LangChain messages to standard dictionaries
        formatted_messages = []
        for m in messages:
            role = "user" if m.type == "human" else "assistant" if m.type == "ai" else "system"
            formatted_messages.append({"role": role, "content": m.content})

        # 2. Call the Sarvam API
        response = client.chat.completions(
            model=self.model,
            messages=formatted_messages,
        )
        
        # 3. Package it back into LangChain's expected format
        # Note: You may need to tweak this slightly depending on if Sarvam returns 
        # dictionary keys like response["choices"] or object attributes like response.choices
        content = response.choices[0].message.content
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=content))])

    @property
    def _llm_type(self) -> str:
        return "custom-sarvam"


