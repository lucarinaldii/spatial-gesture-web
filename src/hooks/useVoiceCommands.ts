import { useEffect, useRef, useState } from 'react';

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
}

export const useVoiceCommands = ({ onAddCard, onDeleteCard }: VoiceCommandsProps): VoiceCommandsHook => {
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

    recognition.onresult = (event: any) => {
      const results = event.results[event.results.length - 1];
      
      // Check all alternatives for better match
      for (let i = 0; i < results.length; i++) {
        const transcript = results[i].transcript.toLowerCase().trim();
        console.log(`Voice command detected: "${transcript}"`);

        // Add card commands in multiple languages
        const addCardPatterns = [
          // Italian
          /aggiungi\s+(una\s+)?card/i,
          /aggiungi\s+(una\s+)?carta/i,
          /nuova\s+card/i,
          /nuova\s+carta/i,
          /crea\s+(una\s+)?card/i,
          // English
          /add\s+(a\s+)?card/i,
          /new\s+card/i,
          /create\s+(a\s+)?card/i,
          // Spanish
          /a[ñn]ade\s+(una\s+)?tarjeta/i,
          /nueva\s+tarjeta/i,
          /crear\s+tarjeta/i,
          // French
          /ajoute\s+(une\s+)?carte/i,
          /nouvelle\s+carte/i,
          /cr[ée]e\s+(une\s+)?carte/i,
          // German
          /karte\s+hinzuf[üu]gen/i,
          /neue\s+karte/i,
          /karte\s+erstellen/i,
          // Portuguese
          /adiciona(r)?\s+(um\s+)?cart[ãa]o/i,
          /novo\s+cart[ãa]o/i,
        ];

        // Delete card commands in multiple languages
        const deleteCardPatterns = [
          // Italian
          /elimina\s+(la\s+)?card/i,
          /elimina\s+(la\s+)?carta/i,
          /rimuovi\s+(la\s+)?card/i,
          /cancella\s+(la\s+)?card/i,
          // English
          /delete\s+(the\s+)?card/i,
          /remove\s+(the\s+)?card/i,
          /erase\s+(the\s+)?card/i,
          // Spanish
          /elimina\s+(la\s+)?tarjeta/i,
          /borra\s+(la\s+)?tarjeta/i,
          /quita\s+(la\s+)?tarjeta/i,
          // French
          /supprime\s+(la\s+)?carte/i,
          /efface\s+(la\s+)?carte/i,
          /retire\s+(la\s+)?carte/i,
          // German
          /karte\s+l[öo]schen/i,
          /entferne\s+(die\s+)?karte/i,
          /karte\s+entfernen/i,
          // Portuguese
          /deleta(r)?\s+(o\s+)?cart[ãa]o/i,
          /remove(r)?\s+(o\s+)?cart[ãa]o/i,
        ];

        // Check for add card command
        if (addCardPatterns.some(pattern => pattern.test(transcript))) {
          console.log('Add card command detected!');
          setCommandRecognized(true);
          if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
          commandTimeoutRef.current = setTimeout(() => setCommandRecognized(false), 1000);
          onAddCard?.();
          return;
        }

        // Check for delete card command
        if (deleteCardPatterns.some(pattern => pattern.test(transcript))) {
          console.log('Delete card command detected!');
          setCommandRecognized(true);
          if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
          commandTimeoutRef.current = setTimeout(() => setCommandRecognized(false), 1000);
          onDeleteCard?.();
          return;
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        // Don't stop on these errors, just continue
        return;
      }
      setIsListening(false);
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
  }, [isListening, onAddCard, onDeleteCard]);

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
