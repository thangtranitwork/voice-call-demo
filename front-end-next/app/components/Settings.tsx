'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, Camera, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Settings() {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [volume, setVolume] = useState(0);
  const [audioPermission, setAudioPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [videoPermission, setVideoPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request both audio and video
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setAudioPermission('granted');
        setVideoPermission('granted');

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        setAudioDevices(allDevices.filter(d => d.kind === 'audioinput'));
        setVideoDevices(allDevices.filter(d => d.kind === 'videoinput'));
        
        // Setup volume meter
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const updateVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
          setVolume(Math.round(sum / bufferLength));
          requestAnimationFrame(updateVolume);
        };
        updateVolume();

        // Setup camera preview
        if (previewRef.current) {
          previewRef.current.srcObject = stream;
        }
        streamRef.current = stream;
      } catch (err: any) {
        // Try audio only
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setAudioPermission('granted');
          setVideoPermission('denied');
          
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          setAudioDevices(allDevices.filter(d => d.kind === 'audioinput'));
          setVideoDevices(allDevices.filter(d => d.kind === 'videoinput'));

          streamRef.current = stream;
        } catch {
          setAudioPermission('denied');
          setVideoPermission('denied');
        }
      }
    };
    getDevices();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl mt-10 space-y-10">
      {/* Audio Settings */}
      <div>
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <Mic className="text-blue-500" /> Audio Settings
        </h2>

        <div className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Microphone</label>
            <select 
              value={selectedMic}
              onChange={(e) => setSelectedMic(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
            >
              {audioDevices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || 'Default Microphone'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Input Level</label>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 to-yellow-500 transition-all duration-75"
                  style={{ width: `${Math.min(volume * 2, 100)}%` }}
                ></div>
              </div>
              <span className="text-xs font-mono text-slate-500 w-8">{volume}</span>
            </div>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
            {audioPermission === 'granted' ? (
              <>
                <CheckCircle2 className="text-emerald-500 mt-0.5" size={18} />
                <p className="text-sm text-slate-300">Microphone access granted. You are ready to make calls.</p>
              </>
            ) : (
              <>
                <AlertCircle className="text-red-500 mt-0.5" size={18} />
                <p className="text-sm text-slate-300">Microphone access is required for voice calls. Please check your browser permissions.</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-800" />

      {/* Camera Settings */}
      <div>
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <Camera className="text-purple-500" /> Camera Settings
        </h2>

        <div className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Camera</label>
            <select
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-purple-500 outline-none appearance-none"
            >
              {videoDevices.length === 0 && (
                <option value="">No cameras found</option>
              )}
              {videoDevices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || 'Default Camera'}</option>
              ))}
            </select>
          </div>

          {/* Camera Preview */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Preview</label>
            <div className="relative aspect-video bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
              <video
                ref={previewRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              {videoPermission !== 'granted' && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                  <div className="text-center">
                    <Camera className="mx-auto mb-3 text-slate-600" size={40} />
                    <p className="text-sm text-slate-500">Camera not available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-start gap-3">
            {videoPermission === 'granted' ? (
              <>
                <CheckCircle2 className="text-emerald-500 mt-0.5" size={18} />
                <p className="text-sm text-slate-300">Camera access granted. You are ready for video calls.</p>
              </>
            ) : (
              <>
                <AlertCircle className="text-amber-500 mt-0.5" size={18} />
                <p className="text-sm text-slate-300">Camera access is optional but required for video calls. Voice calls will still work.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
