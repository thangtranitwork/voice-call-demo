import { useRef, useCallback, useState } from 'react';

export type CallMode = 'voice' | 'video';

export const useWebRTC = (sendMessage: (msg: any) => void) => {
  const pc = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callMode, setCallMode] = useState<CallMode>('voice');

  const getMediaConstraints = useCallback((mode: CallMode): MediaStreamConstraints => {
    if (mode === 'video') {
      return {
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      };
    }
    return { audio: true };
  }, []);

  const createPeerConnection = useCallback((targetId: string) => {
    if (pc.current) {
      pc.current.close();
    }

    pc.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: 'call_ice_candidate',
          to: targetId,
          payload: event.candidate,
        });
      }
    };

    pc.current.ontrack = (event) => {
      remoteStream.current = event.streams[0];
      // Set remote video element
      const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement;
      if (remoteVideo) {
        remoteVideo.srcObject = event.streams[0];
      }
      // Also set remote audio for voice-only fallback
      const remoteAudio = document.getElementById('remote-audio') as HTMLAudioElement;
      if (remoteAudio) {
        remoteAudio.srcObject = event.streams[0];
      }
    };

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        pc.current?.addTrack(track, localStream.current!);
      });
    }

    return pc.current;
  }, [sendMessage]);

  const startCall = useCallback(async (targetId: string, mode: CallMode = 'voice') => {
    try {
      setCallMode(mode);
      localStream.current = await navigator.mediaDevices.getUserMedia(getMediaConstraints(mode));
      
      // Set local video preview
      if (mode === 'video') {
        const localVideo = document.getElementById('local-video') as HTMLVideoElement;
        if (localVideo) {
          localVideo.srcObject = localStream.current;
        }
      }

      const peerConnection = createPeerConnection(targetId);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      sendMessage({
        type: mode === 'video' ? 'video_call_offer' : 'call_offer',
        to: targetId,
        payload: offer,
      });
    } catch (err) {
      console.error('Start call error:', err);
    }
  }, [createPeerConnection, sendMessage, getMediaConstraints]);

  const handleOffer = useCallback(async (fromId: string, offer: RTCSessionDescriptionInit, mode: CallMode = 'voice') => {
    try {
      setCallMode(mode);
      localStream.current = await navigator.mediaDevices.getUserMedia(getMediaConstraints(mode));

      // Set local video preview
      if (mode === 'video') {
        const localVideo = document.getElementById('local-video') as HTMLVideoElement;
        if (localVideo) {
          localVideo.srcObject = localStream.current;
        }
      }

      const peerConnection = createPeerConnection(fromId);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      sendMessage({
        type: mode === 'video' ? 'video_call_answer' : 'call_answer',
        to: fromId,
        payload: answer,
      });
    } catch (err) {
      console.error('Handle offer error:', err);
    }
  }, [createPeerConnection, sendMessage, getMediaConstraints]);

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    try {
      if (pc.current) {
        await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (err) {
      console.error('Handle answer error:', err);
    }
  }, []);

  const handleCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    try {
      if (pc.current) {
        await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error('Handle candidate error:', err);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, []);

  const hangup = useCallback(() => {
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
    setIsMuted(false);
    setIsVideoOff(false);
    setCallMode('voice');
  }, []);

  return {
    startCall,
    handleOffer,
    handleAnswer,
    handleCandidate,
    hangup,
    toggleMute,
    toggleVideo,
    isMuted,
    isVideoOff,
    callMode,
    setCallMode,
    localStream: localStream.current,
  };
};
