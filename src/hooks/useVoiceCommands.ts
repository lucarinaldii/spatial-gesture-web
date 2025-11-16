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
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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
    // Check if MediaRecorder is supported
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      console.warn('MediaRecorder not supported in this browser');
      setIsSupported(false);
      return;
    }
    setIsSupported(true);
  }, []);

  const processAudioChunk = async () => {
    if (audioChunksRef.current.length === 0) return;

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      audioChunksRef.current = [];

      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        console.log('[Voice] Sending audio for transcription...');
        
        // Send to transcription edge function
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) {
          console.error('[Voice] Transcription error:', error);
          return;
        }

        if (data?.text) {
          console.log('[Voice] Transcription:', data.text);
          setTranscriptText(data.text);
          
          // Process command
          await processCommand(data.text);
        }
      };
    } catch (err) {
      console.error('[Voice] Error processing audio chunk:', err);
    }
  };

  const processCommand = async (transcript: string) => {
    try {
      console.log('[Voice] Sending to AI for interpretation...', { 
        command: transcript, 
        grabbedCards: grabbedCardIdsRef.current.length 
      });

      // Send to AI for interpretation
      const { data, error } = await supabase.functions.invoke('interpret-voice-command', {
        body: { 
          command: transcript,
          grabbedCardIds: grabbedCardIdsRef.current 
        }
      });

      console.log('[Voice] AI response:', { data, error });

      if (error) {
        console.error('[Voice] Error from edge function:', error);
        setCommandError(true);
        setTimeout(() => {
          setCommandError(false);
          setTranscriptText('');
        }, 1500);
        return;
      }

      const { action } = data;
      console.log('[Voice] AI interpreted action:', action);

      if (!action) {
        console.log('[Voice] No valid action recognized');
        setCommandError(true);
        setTimeout(() => {
          setCommandError(false);
          setTranscriptText('');
        }, 1500);
        return;
      }

      // Visual feedback
      setCommandRecognized(true);
      setTimeout(() => {
        setCommandRecognized(false);
        setTranscriptText('');
      }, 1000);

      // Execute action
      let success = false;
      console.log('[Voice] Executing action:', action);
      
      switch (action) {
        case 'add_card':
          onAddCardRef.current?.();
          success = true;
          console.log('[Voice] Card added');
          break;
        case 'delete_card':
          onDeleteCardRef.current?.();
          success = true;
          console.log('[Voice] Card deleted');
          break;
        case 'clear_all':
          onClearAllRef.current?.();
          success = true;
          console.log('[Voice] All cards cleared');
          break;
        default:
          console.log('[Voice] Unknown action:', action);
      }

      if (success) {
        setCommandSuccess(true);
        setTimeout(() => {
          setCommandSuccess(false);
          setTranscriptText('');
        }, 1500);
      }
    } catch (err) {
      console.error('[Voice] Error processing voice command:', err);
      setCommandError(true);
      setTimeout(() => {
        setCommandError(false);
        setTranscriptText('');
      }, 1500);
    }
  };

  const startListening = async () => {
    if (!isSupported) {
      console.warn('[Voice] MediaRecorder not supported');
      setCommandError(true);
      setTimeout(() => setCommandError(false), 2000);
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        processAudioChunk();
      };

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Start recording
      mediaRecorder.start();
      setIsListening(true);
      setTranscriptText('');
      
      // Process audio every 3 seconds for live transcription
      transcriptionTimerRef.current = setInterval(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          mediaRecorder.start();
        }
      }, 3000);
      
      console.log('[Voice] Recording started successfully');
    } catch (error) {
      console.error('[Voice] Error starting recording:', error);
      setIsListening(false);
      setCommandError(true);
      setTimeout(() => setCommandError(false), 3000);
    }
  };

  const stopListening = () => {
    if (transcriptionTimerRef.current) {
      clearInterval(transcriptionTimerRef.current);
      transcriptionTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsListening(false);
    setTranscriptText('');
    console.log('[Voice] Recording stopped');
  };

  useEffect(() => {
    return () => {
      if (transcriptionTimerRef.current) {
        clearInterval(transcriptionTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
