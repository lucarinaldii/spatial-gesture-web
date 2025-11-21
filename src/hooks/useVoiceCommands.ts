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
  transcriptText: string;
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
  const [transcriptText, setTranscriptText] = useState('');
  const recognitionRef = useRef<any>(null);
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store latest callbacks in refs
  const onAddCardRef = useRef(onAddCard);
  const onDeleteCardRef = useRef(onDeleteCard);
  const onClearAllRef = useRef(onClearAll);
  const grabbedCardIdsRef = useRef(grabbedCardIds);
  
  useEffect(() => {
    onAddCardRef.current = onAddCard;
    onDeleteCardRef.current = onDeleteCard;
    onClearAllRef.current = onClearAll;
    grabbedCardIdsRef.current = grabbedCardIds;
  }, [onAddCard, onDeleteCard, onClearAll, grabbedCardIds]);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported');
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onresult = async (event: any) => {
      const results = event.results[event.results.length - 1];
      const transcript = results[0].transcript.trim();
      
      // Show live transcription
      setTranscriptText(transcript);
      
      // Only process final results
      if (!results.isFinal) return;
      
      console.log(`[Voice] Final: "${transcript}"`);
      await processCommand(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('[Voice] Error:', event.error);
      if (event.error === 'no-speech') return;
      if (event.error === 'audio-capture' || event.error === 'not-allowed') {
        setIsListening(false);
        setCommandError(true);
        setTimeout(() => setCommandError(false), 2000);
      }
    };

    recognition.onend = () => {
      if (isListening && recognitionRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.error('[Voice] Restart failed:', e);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    };
  }, [isListening]);

  const processCommand = async (transcript: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('interpret-voice-command', {
        body: { 
          command: transcript,
          grabbedCardIds: grabbedCardIdsRef.current 
        }
      });

      if (error || !data?.action) {
        setCommandError(true);
        setTimeout(() => {
          setCommandError(false);
          setTranscriptText('');
        }, 1500);
        return;
      }

      setCommandRecognized(true);
      setTimeout(() => {
        setCommandRecognized(false);
        setTranscriptText('');
      }, 1000);

      let success = false;
      switch (data.action) {
        case 'add_card':
          onAddCardRef.current?.();
          success = true;
          break;
        case 'delete_card':
          onDeleteCardRef.current?.();
          success = true;
          break;
        case 'clear_all':
          onClearAllRef.current?.();
          success = true;
          break;
      }

      if (success) {
        setCommandSuccess(true);
        setTimeout(() => {
          setCommandSuccess(false);
          setTranscriptText('');
        }, 1500);
      }
    } catch (err) {
      setCommandError(true);
      setTimeout(() => {
        setCommandError(false);
        setTranscriptText('');
      }, 1500);
    }
  };

  const startListening = () => {
    if (!isSupported || !recognitionRef.current) {
      setCommandError(true);
      setTimeout(() => setCommandError(false), 2000);
      return;
    }
    
    try {
      setTranscriptText('');
      recognitionRef.current.start();
      setIsListening(true);
      console.log('[Voice] Started');
    } catch (error) {
      console.error('[Voice] Start error:', error);
      setCommandError(true);
      setTimeout(() => setCommandError(false), 2000);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      setIsListening(false);
      setTranscriptText('');
      console.log('[Voice] Stopped');
    } catch (e) {
      console.error('[Voice] Stop error:', e);
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
    transcriptText,
  };
};
