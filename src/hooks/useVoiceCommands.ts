import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VoiceCommandsHook {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  commandRecognized: boolean;
}

interface VoiceCommandsProps {
  onAddCard?: () => void;
  onDeleteCard?: () => void;
  onClearAll?: () => void;
  grabbedCardIds?: string[];
}

export const useVoiceCommands = ({ onAddCard, onDeleteCard, onClearAll, grabbedCardIds = [] }: VoiceCommandsProps): VoiceCommandsHook => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [commandRecognized, setCommandRecognized] = useState(false);
  const recognitionRef = useRef<any>(null);
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported in this browser');
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    // Support multiple languages
    recognition.lang = navigator.language || 'en-US';

    recognition.onresult = async (event: any) => {
      const results = event.results[event.results.length - 1];
      
      // Get the best transcript
      const transcript = results[0].transcript.trim();
      console.log(`Voice command detected: "${transcript}"`);

      try {
        // Send to AI for interpretation
        const { data, error } = await supabase.functions.invoke('interpret-voice-command', {
          body: { 
            command: transcript,
            grabbedCardIds 
          }
        });

        if (error) {
          console.error('Error interpreting command:', error);
          return;
        }

        const { action } = data;
        console.log('AI interpreted action:', action);

        if (!action) {
          console.log('No valid action recognized');
          return;
        }

        // Visual feedback
        setCommandRecognized(true);
        if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
        commandTimeoutRef.current = setTimeout(() => setCommandRecognized(false), 1000);

        // Execute action
        switch (action) {
          case 'add_card':
            onAddCard?.();
            break;
          case 'delete_card':
            onDeleteCard?.();
            break;
          case 'clear_all':
            onClearAll?.();
            break;
          default:
            console.log('Unknown action:', action);
        }
      } catch (err) {
        console.error('Error processing voice command:', err);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      // Don't stop on common transient errors
      if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'network') {
        return;
      }
      // Only stop on critical errors
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        console.warn('Microphone access denied. Please grant microphone permissions.');
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (isListening) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Error restarting recognition:', e);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping recognition:', e);
        }
      }
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
      }
    };
  }, [isListening, onAddCard, onDeleteCard, onClearAll, grabbedCardIds]);

  const startListening = () => {
    if (!isSupported || !recognitionRef.current) return;
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
      console.log('Voice recognition started');
    } catch (e) {
      console.error('Error starting recognition:', e);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      setIsListening(false);
      console.log('Voice recognition stopped');
    } catch (e) {
      console.error('Error stopping recognition:', e);
    }
  };

  return {
    isListening,
    startListening,
    stopListening,
    isSupported,
    commandRecognized,
  };
};
