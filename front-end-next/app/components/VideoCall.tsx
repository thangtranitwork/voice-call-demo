'use client';

import { useEffect, useRef } from 'react';

interface VideoCallProps {
  isActive: boolean;
  localStream: MediaStream | null;
}

export default function VideoCall({ isActive, localStream }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Sync local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  if (!isActive) return null;

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden bg-slate-950">
      {/* Remote Video (Full Screen) */}
      <video
        id="remote-video"
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient Overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* Remote placeholder when no video */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-slate-700 text-sm font-bold uppercase tracking-widest animate-pulse">
          Connecting Video...
        </div>
      </div>

      {/* Local Video (Picture-in-Picture) */}
      <div className="absolute top-6 right-6 w-40 h-28 sm:w-52 sm:h-36 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shadow-black/50 bg-slate-900 z-10 group hover:scale-105 transition-transform">
        <video
          id="local-video"
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover mirror"
          style={{ transform: 'scaleX(-1)' }}
        />
        {/* Camera off placeholder */}
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/90 opacity-0 peer-disabled:opacity-100">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Camera Off</span>
        </div>
        {/* "You" label */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-lg">
          <span className="text-[10px] text-white font-bold uppercase tracking-wider">You</span>
        </div>
      </div>
    </div>
  );
}
