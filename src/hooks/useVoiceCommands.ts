import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VoiceCommandsHook {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  commandRecognized: boolean;
  commandSuccess: boolean;
  commandError: boolean;
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
  const [commandSuccess, setCommandSuccess] = useState(false);
  const [commandError, setCommandError] = useState(false);
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
      console.log(`[Voice] Transcript received: "${transcript}"`);

      try {
        console.log('[Voice] Sending to AI for interpretation...', { 
          command: transcript, 
          grabbedCards: grabbedCardIds.length 
        });

        // Send to AI for interpretation
        const { data, error } = await supabase.functions.invoke('interpret-voice-command', {
          body: { 
            command: transcript,
            grabbedCardIds 
          }
        });

        console.log('[Voice] AI response:', { data, error });

        if (error) {
          console.error('[Voice] Error from edge function:', error);
          setCommandError(true);
          setTimeout(() => setCommandError(false), 1500);
          return;
        }

        const { action } = data;
        console.log('[Voice] AI interpreted action:', action);

        if (!action) {
          console.log('[Voice] No valid action recognized');
          setCommandError(true);
          setTimeout(() => setCommandError(false), 1500);
          return;
        }

        // Visual feedback
        setCommandRecognized(true);
        if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
        commandTimeoutRef.current = setTimeout(() => setCommandRecognized(false), 1000);

        // Execute action
        let success = false;
        console.log('[Voice] Executing action:', action);
        
        switch (action) {
          case 'add_card':
            onAddCard?.();
            success = true;
            console.log('[Voice] Card added');
            break;
          case 'delete_card':
            onDeleteCard?.();
            success = true;
            console.log('[Voice] Card deleted');
            break;
          case 'clear_all':
            onClearAll?.();
            success = true;
            console.log('[Voice] All cards cleared');
            break;
          default:
            console.log('[Voice] Unknown action:', action);
        }

        if (success) {
          setCommandSuccess(true);
          setTimeout(() => setCommandSuccess(false), 1500);
        }
      } catch (err) {
        console.error('[Voice] Error processing voice command:', err);
        setCommandError(true);
        setTimeout(() => setCommandError(false), 1500);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[Voice] Speech recognition error:', event.error);
      // Don't stop on common transient errors
      if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'network') {
        console.log('[Voice] Transient error, continuing...');
        return;
      }
      // Only stop on critical errors
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        console.warn('[Voice] Microphone access denied. Please grant microphone permissions.');
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
    if (!isSupported || !recognitionRef.current) {
      console.warn('[Voice] Speech recognition not supported');
      return;
    }
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
      console.log('[Voice] Voice recognition started successfully');
    } catch (e) {
      console.error('[Voice] Error starting recognition:', e);
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
    commandSuccess,
    commandError,
  };
};
