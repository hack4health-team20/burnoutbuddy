import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MoodValue, TimeAvailable } from "@/types";
import { useAppState } from "@/context/app-state-context";
import { buildRecommendation } from "@/lib/recommendation";

// Type definitions for speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface AIWellnessCoachProps {
  onMoodSelected: (mood: MoodValue, reason: string) => void;
  timeAvailable: TimeAvailable;
  onShift: boolean;
}

export const AIWellnessCoach = ({ onMoodSelected, timeAvailable, onShift }: AIWellnessCoachProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null); // Will hold the speech recognition object
  const { data } = useAppState();

  // Initialize speech recognition if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if SpeechRecognition is supported
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          setIsRecording(false);
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
          
          // Show user-friendly message for common errors
          if (event.error === "network") {
            alert("Speech recognition requires an internet connection and works best over HTTPS. Please try typing your response instead.");
          } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            alert("Microphone access was not granted or speech recognition service is not available. Please check your browser settings or type your response instead.");
          } else if (event.error === "audio-capture") {
            alert("Could not access the microphone. Please check your browser permissions and ensure a microphone is connected.");
          }
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      } else {
        console.info("Speech recognition not supported in this browser");
      }
    }
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add introductory message when component mounts
  useEffect(() => {
    setMessages([
      {
        id: "intro",
        text: "Hello! I'm your AI wellness coach. How has your day been so far? Share anything that stands out - positive or challenging.",
        sender: "ai",
        timestamp: new Date(),
      }
    ]);
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      // Call the API to analyze the mood using OpenAI
      const response = await fetch('/api/analyze-mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        // Show error message to user
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to analyze mood:', errorData);

        // Send fallback message to user
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `I'm having trouble analyzing your mood right now. Could you rephrase or try something different?`,
          sender: "ai",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const { detectedMood, confidence, reason } = await response.json();

        // Add AI response
        let aiResponseText = `${reason} Should I select "${detectedMood}" as your current mood?`;

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: aiResponseText,
          sender: "ai",
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("Error processing message", error);

      const aiMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: "I'm having trouble analyzing that right now. Could you share a bit more about how you're feeling?",
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoodConfirmation = (mood: MoodValue) => {
    // Use the reason from the API analysis
    onMoodSelected(mood, messages[messages.length - 1].text);
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        alert("Speech recognition is not supported in your browser or is unavailable. You can still type your response below.");
        // Focus the text input when speech isn't available
        const inputElement = document.querySelector('input[placeholder="Share how your day went..."]') as HTMLInputElement;
        inputElement?.focus();
      }
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.sender === "user"
                  ? "bg-[var(--accent)] text-white rounded-br-md"
                  : "bg-white/70 text-[var(--text)] rounded-bl-md"
              }`}
            >
              <p>{message.text}</p>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white/70 text-[var(--text)] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-[var(--muted)] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[var(--muted)] rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-[var(--muted)] rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mood confirmation buttons (only appear when AI suggests a mood) */}
      {messages.length > 0 && messages[messages.length - 1]?.text.includes("Would you like me to select") && (
        <div className="p-4 border-t border-white/40 bg-white/50 rounded-b-[var(--radius-lg)]">
          <p className="text-sm text-[var(--muted)] mb-3">Confirm your mood:</p>
          <div className="flex flex-wrap gap-2">
            {(['calm', 'ok', 'stressed', 'exhausted'] as MoodValue[]).map((mood) => (
              <Button
                key={mood}
                variant="secondary"
                size="sm"
                onClick={() => handleMoodConfirmation(mood)}
                className="capitalize"
              >
                {mood}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-white/40 bg-white/50 rounded-b-[var(--radius-lg)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Share how your day went..."
            className="flex-1 rounded-full border border-white/40 bg-white/70 px-4 py-3 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
            disabled={isLoading}
          />
          <Button
            variant="secondary"
            onClick={handleVoiceInput}
            disabled={isLoading}
            className={`w-12 h-12 flex items-center justify-center rounded-full shadow-sm ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/90 hover:bg-white text-[var(--accent)]'}`}
          >
            {isRecording ? (
              <span className="flex h-4 w-4">
                <span className="animate-ping absolute h-4 w-4 rounded-full bg-white opacity-75"></span>
                <span className="relative h-4 w-4 rounded-full bg-white"></span>
              </span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
              </svg>
            )}
          </Button>
          <Button onClick={handleSend} disabled={!inputText.trim() || isLoading}>
            Send
          </Button>
        </div>
        <p className="text-xs text-[var(--muted)]/70 mt-2">
          Describe your day - the AI wellness coach will analyze your sentiment and suggest an appropriate mood.
        </p>
      </div>
    </Card>
  );
};