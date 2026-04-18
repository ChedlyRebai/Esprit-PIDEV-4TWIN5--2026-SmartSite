import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMainContentElement, getSpeakablePlainText } from "./accessibility/getMainContent";

/**
 * Compact navbar button for voice accessibility (read aloud)
 * Minimal wrapper around Web Speech API
 */
export function NavbarAccessibilityButton() {
  const [speaking, setSpeaking] = useState(false);
  const pathRef = useRef(typeof window !== "undefined" ? window.location.pathname : "");

  const cancelSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  useEffect(() => {
    const onPathPoll = () => {
      const p = window.location.pathname;
      if (p !== pathRef.current) {
        pathRef.current = p;
        cancelSpeech();
      }
    };
    const id = window.setInterval(onPathPoll, 350);
    window.addEventListener("popstate", onPathPoll);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("popstate", onPathPoll);
      cancelSpeech();
    };
  }, [cancelSpeech]);

  const handleReadAloud = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }

    if (speaking) {
      cancelSpeech();
      return;
    }

    const main = getMainContentElement();
    const text = getSpeakablePlainText(main);
    if (!text) {
      return;
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = document.documentElement.lang || navigator.language || "en-US";
    utter.rate = 1;
    utter.onend = () => {
      setSpeaking(false);
    };
    utter.onerror = () => {
      setSpeaking(false);
    };

    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleReadAloud}
      className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      aria-label={speaking ? "Stop reading page aloud" : "Read page aloud"}
      aria-pressed={speaking}
      title={speaking ? "Stop" : "Read aloud"}
    >
      {speaking ? (
        <Volume2 className="h-4 w-4 animate-pulse text-blue-600" aria-hidden="true" />
      ) : (
        <Volume2 className="h-4 w-4" aria-hidden="true" />
      )}
    </Button>
  );
}
