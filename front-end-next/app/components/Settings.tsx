'use client';

import { useState, useEffect } from 'react';
import { Mic, Speaker, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Settings() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [volume, setVolume] = useState(0);
  const [permission, setPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  useEffect(() => {
    const getDevices = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setPermission('granted');
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        setDevices(allDevices.filter(d => d.kind === 'audioinput'));
        
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
      } catch (err) {
        setPermission('denied');
      }
    };
    getDevices();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl mt-10">
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
            {devices.map(d => (
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
          {permission === 'granted' ? (
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
  );
}
