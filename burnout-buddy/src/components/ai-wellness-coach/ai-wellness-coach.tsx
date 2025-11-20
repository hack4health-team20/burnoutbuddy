import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MoodValue, TimeAvailable } from "@/types";

// Type definitions for speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

interface BrowserSpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface BrowserSpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const getSpeechRecognitionConstructor = (): SpeechRecognitionConstructor | null => {
  if (typeof window === "undefined") return null;
  const Constructor = window.SpeechRecognition || window.webkitSpeechRecognition;
  return Constructor ?? null;
};

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
  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  // Initialize speech recognition if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionCtor = getSpeechRecognitionConstructor();

      if (SpeechRecognitionCtor) {
        recognitionRef.current = new SpeechRecognitionCtor();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: BrowserSpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          setIsRecording(false);
        };

        recognitionRef.current.onerror = (event: BrowserSpeechRecognitionErrorEvent) => {
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
    const shiftHint = onShift ? "I know you're mid-shift, so feel free to vent about the moment between patients." : "Since you're off shift, take a breath and tell me how the day actually felt.";
    const timeHint = timeAvailable === "2m" ? "We have about two mindful minutes." : "We have closer to five minutes if you'd like to go deeper.";
    setMessages([
      {
        id: "intro",
        text: `Hello! I'm your AI wellness coach. ${shiftHint} ${timeHint} Share anything that stands out—positive or challenging—and I'll suggest a mood that fits.`,
        sender: "ai",
        timestamp: new Date(),
      }
    ]);
  }, [onShift, timeAvailable]);

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
        const confidenceText = typeof confidence === "number" ? ` (confidence: ${(confidence * 100).toFixed(0)}%)` : "";
        const aiResponseText = `${reason}${confidenceText}. Should I select "${detectedMood}" as your current mood?`;

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
    // Set the selected mood to show visual feedback
    setSelectedMood(mood);
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
    <Card className="flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-white/40 bg-white/90 shadow-[var(--shadow-soft)]">
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6" style={{ minHeight: 280 }}>
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
      {messages.length > 0 && messages[messages.length - 1]?.text.includes("Should I select") && (
        <div className="border-t border-white/40 bg-white/70 px-4 py-4 sm:px-6">
          <p className="mb-3 text-sm text-[var(--muted)]">Confirm your mood:</p>
          <div className="flex flex-wrap gap-2">
            {(['calm', 'ok', 'stressed', 'exhausted'] as MoodValue[]).map((mood) => (
              <Button
                key={mood}
                variant={selectedMood === mood ? "primary" : "secondary"}
                size="sm"
                onClick={() => handleMoodConfirmation(mood)}
                className="capitalize"
              >
                {mood}
                {selectedMood === mood && (
                  <span className="ml-1">✓</span>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="w-full border-t border-white/40 bg-white/80 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Share how your day went..."
            className="w-full flex-1 rounded-full border border-white/60 bg-white/95 px-4 py-3 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] sm:min-w-0"
            disabled={isLoading}
          />
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button
              variant="secondary"
              onClick={handleVoiceInput}
              disabled={isLoading}
              className={`flex h-12 w-full items-center justify-center rounded-full shadow-sm sm:w-12 ${isRecording ? "!bg-red-500 !hover:bg-red-600" : "!bg-[var(--accent)] !hover:bg-[var(--accent-strong)]"} !text-white`}
            >
              <span className="relative flex h-5 w-5 items-center justify-center">
                {isRecording && (
                  <span className="absolute h-6 w-6 rounded-full border border-white/70 opacity-70 animate-ping" />
                )}
                <Mic className="relative h-4 w-4" strokeWidth={2.4} color="white" />
              </span>
            </Button>
            <Button
              onClick={handleSend}
              disabled={!inputText.trim() || isLoading}
              className="w-full justify-center sm:w-auto"
            >
              Send
            </Button>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-[var(--muted)]/70 sm:text-left">
          Describe your day—the AI wellness coach will analyze your sentiment and suggest an appropriate mood and reset path.
        </p>
      </div>
    </Card>
  );
};