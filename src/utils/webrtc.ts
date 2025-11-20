import { supabase } from '@/integrations/supabase/client';

export class WebRTCConnection {
  private pc: RTCPeerConnection | null = null;
  private channel: any = null;
  private sessionId: string;
  private onRemoteStream?: (stream: MediaStream) => void;
  private onConnectionStateChange?: (state: string) => void;

  constructor(
    sessionId: string,
    onRemoteStream?: (stream: MediaStream) => void,
    onConnectionStateChange?: (state: string) => void
  ) {
    this.sessionId = sessionId;
    this.onRemoteStream = onRemoteStream;
    this.onConnectionStateChange = onConnectionStateChange;
  }

  async initializeAsOfferer(localStream: MediaStream) {
    console.log('Initializing as offerer with session:', this.sessionId);
    
    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add local stream
    localStream.getTracks().forEach(track => {
      console.log('Adding track to peer connection:', track.kind);
      this.pc!.addTrack(track, localStream);
    });

    // Set up connection state monitoring
    this.pc.onconnectionstatechange = () => {
      console.log('Connection state:', this.pc?.connectionState);
      this.onConnectionStateChange?.(this.pc?.connectionState || 'unknown');
    };

    // Set up ICE candidate handling
    this.pc.onicecandidate = async (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate');
        await this.channel.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate, from: 'mobile' }
        });
      }
    };

    // Create offer
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    console.log('Created and set local description (offer)');

    // Set up channel with broadcast enabled
    this.channel = supabase.channel(`camera-${this.sessionId}`, {
      config: {
        broadcast: { self: true },
      },
    });
    
    // Listen for answer and ICE candidates
    this.channel
      .on('broadcast', { event: 'answer' }, async ({ payload }: any) => {
        console.log('Received answer from desktop');
        if (this.pc && payload.answer) {
          await this.pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
          console.log('Set remote description (answer)');
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }: any) => {
        if (this.pc && payload.candidate && payload.from === 'desktop') {
          console.log('Received ICE candidate from desktop');
          await this.pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      })
      .subscribe(async (status) => {
        console.log('Offerer channel status:', status);
        if (status === 'SUBSCRIBED') {
          // Send offer
          console.log('Sending offer to desktop');
          await this.channel.send({
            type: 'broadcast',
            event: 'offer',
            payload: { offer: this.pc!.localDescription }
          });
        }
      });
  }

  async initializeAsAnswerer() {
    console.log('Initializing as answerer with session:', this.sessionId);
    
    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Set up connection state monitoring
    this.pc.onconnectionstatechange = () => {
      console.log('Connection state:', this.pc?.connectionState);
      this.onConnectionStateChange?.(this.pc?.connectionState || 'unknown');
    };

    // Handle incoming stream
    this.pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        console.log('Setting remote stream');
        this.onRemoteStream?.(event.streams[0]);
      }
    };

    // Set up ICE candidate handling
    this.pc.onicecandidate = async (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate');
        await this.channel.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate, from: 'desktop' }
        });
      }
    };

    // Set up channel with broadcast enabled
    this.channel = supabase.channel(`camera-${this.sessionId}`, {
      config: {
        broadcast: { self: true },
      },
    });
    
    // Listen for offer and ICE candidates
    this.channel
      .on('broadcast', { event: 'offer' }, async ({ payload }: any) => {
        console.log('Received offer from mobile');
        if (this.pc && payload.offer) {
          await this.pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
          console.log('Set remote description (offer)');
          
          // Create answer
          const answer = await this.pc.createAnswer();
          await this.pc.setLocalDescription(answer);
          console.log('Created and set local description (answer)');
          
          // Send answer
          console.log('Sending answer to mobile');
          await this.channel.send({
            type: 'broadcast',
            event: 'answer',
            payload: { answer: this.pc.localDescription }
          });
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }: any) => {
        if (this.pc && payload.candidate && payload.from === 'mobile') {
          console.log('Received ICE candidate from mobile');
          await this.pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      })
      .subscribe((status) => {
        console.log('Answerer channel status:', status);
      });
  }

  disconnect() {
    console.log('Disconnecting WebRTC connection');
    this.pc?.close();
    this.channel?.unsubscribe();
  }
}
