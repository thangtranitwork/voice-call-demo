'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/app/store/auth.store';
import { useWebSocket } from '@/app/hooks/useWebSocket';
import { useWebRTC } from '@/app/hooks/useWebRTC';
import api from '@/app/lib/api';
import { Phone, PhoneOff, Mic, MicOff, User as UserIcon, Search, UserPlus, History, Users, Settings as SettingsIcon } from 'lucide-react';
import Settings from '@/app/components/Settings';
import VoiceVisualizer from '@/app/components/VoiceVisualizer';

export default function Dashboard() {
  const { user, accessToken, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'contacts' | 'history' | 'settings'>('contacts');
  const [contacts, setContacts] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [currentCall, setCurrentCall] = useState<any>(null);

  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const dialtoneRef = useRef<HTMLAudioElement | null>(null);

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const showNotification = (from: string) => {
    if (Notification.permission === 'granted') {
      new Notification('Incoming Voice Call', {
        body: `${from} is calling you...`,
        icon: '/favicon.ico',
      });
    }
  };

  const resetCall = useCallback(() => {
    setCallState('idle');
    setCurrentCall(null);
    if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current.currentTime = 0; }
    if (dialtoneRef.current) { dialtoneRef.current.pause(); dialtoneRef.current.currentTime = 0; }
  }, []);

  const onMessage = useCallback((msg: any) => {
    switch (msg.type) {
      case 'call_offer':
        setCurrentCall({ from: msg.from, offer: msg.payload });
        setCallState('ringing');
        showNotification(msg.from);
        if (ringtoneRef.current) ringtoneRef.current.play().catch(() => {});
        break;
      case 'call_answer':
        handleAnswer(msg.payload);
        setCallState('connected');
        if (dialtoneRef.current) { dialtoneRef.current.pause(); dialtoneRef.current.currentTime = 0; }
        break;
      case 'call_ice_candidate':
        handleCandidate(msg.payload);
        break;
      case 'call_hangup':
      case 'call_reject':
        resetCall();
        break;
      case 'call_offline':
        alert('User is offline');
        resetCall();
        break;
    }
  }, [resetCall]);

  const { sendMessage, isConnected } = useWebSocket(onMessage);
  const { startCall, handleOffer, handleAnswer, handleCandidate, hangup, toggleMute, isMuted, localStream } = useWebRTC(sendMessage);

  const fetchData = useCallback(async () => {
    try {
      const [contactsRes, logsRes] = await Promise.all([
        api.get('/contacts'),
        api.get('/calls')
      ]);
      setContacts(contactsRes.data || []);
      setCallLogs(logsRes.data || []);
    } catch (err) {
      console.error('Fetch error', err);
    }
  }, []);

  useEffect(() => {
    if (accessToken) fetchData();
  }, [accessToken, fetchData]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const res = await api.get(`/users/search?q=${searchQuery}`);
      setSearchResults(res.data || []);
    } catch (err) {
      console.error('Search error', err);
    }
  };

  const addContact = async (id: number) => {
    try {
      await api.post('/contacts', { contact_id: id });
      setSearchQuery('');
      setSearchResults([]);
      fetchData();
    } catch (err) {
      alert('Error adding contact');
    }
  };

  const initiateCall = (targetId: number, displayName: string) => {
    setCurrentCall({ to: targetId, displayName });
    setCallState('calling');
    if (dialtoneRef.current) dialtoneRef.current.play().catch(() => {});
    startCall(targetId.toString());
  };

  const acceptCall = () => {
    if (!currentCall) return;
    handleOffer(currentCall.from, currentCall.offer);
    setCallState('connected');
    if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current.currentTime = 0; }
  };

  const rejectCall = () => {
    if (!currentCall) return;
    sendMessage({ type: 'call_reject', to: currentCall.from });
    resetCall();
  };

  const endCall = () => {
    const target = currentCall?.from || currentCall?.to;
    if (target) {
      sendMessage({ type: 'call_hangup', to: target.toString() });
    }
    hangup();
    resetCall();
    fetchData();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      <audio id="remote-audio" autoPlay className="hidden" />
      <audio ref={ringtoneRef} loop className="hidden" src="https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3" />
      <audio ref={dialtoneRef} loop className="hidden" src="https://assets.mixkit.co/active_storage/sfx/1358/1358-preview.mp3" />

      <header className="flex justify-between items-center p-4 lg:px-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10 shadow-2xl shadow-blue-500/5">
        <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 via-emerald-400 to-indigo-500 bg-clip-text text-transparent">
          VOICE.APP
        </h1>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700/50 shadow-inner">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center gap-4 border-l border-slate-800 pl-6">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-slate-100">{user.display_name}</div>
              <button onClick={logout} className="text-[10px] text-slate-500 hover:text-red-400 uppercase tracking-widest transition-colors font-bold">Logout</button>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center shadow-xl">
              <UserIcon size={24} className="text-blue-400" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden h-[calc(100vh-81px)]">
        {/* Sidebar */}
        <div className="lg:col-span-4 border-r border-slate-800/50 flex flex-col bg-slate-900/30 backdrop-blur-sm">
          <div className="p-6 space-y-6">
            <form onSubmit={handleSearch} className="relative group">
              <input
                type="text"
                placeholder="Find people to call..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500 text-sm"
              />
              <Search className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
            </form>

            {searchResults.length > 0 && (
              <div className="bg-blue-600/5 rounded-2xl p-3 border border-blue-500/20 animate-in fade-in slide-in-from-top-2">
                <div className="text-[10px] text-blue-400 mb-3 px-2 uppercase font-black tracking-widest">Search Results</div>
                {searchResults.map((u) => (
                  <div key={u.id} className="flex justify-between items-center p-3 hover:bg-blue-500/10 rounded-xl transition-colors group">
                    <span className="text-sm font-semibold text-slate-200">{u.display_name} <span className="text-slate-500 font-normal">@{u.username}</span></span>
                    <button onClick={() => addContact(u.id)} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all scale-90 group-hover:scale-100">
                      <UserPlus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/30 shadow-inner">
              <button
                onClick={() => setActiveTab('contacts')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${activeTab === 'contacts' ? 'bg-slate-700 text-blue-400 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Users size={18} /> Contacts
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${activeTab === 'history' ? 'bg-slate-700 text-blue-400 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <History size={18} /> History
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${activeTab === 'settings' ? 'bg-slate-700 text-blue-400 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <SettingsIcon size={18} /> Settings
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
            {activeTab === 'contacts' ? (
              <div className="space-y-3">
                {contacts.length === 0 && (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-slate-800/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700/30">
                      <Users size={24} className="text-slate-600" />
                    </div>
                    <p className="text-slate-500 text-sm">Your contact list is empty</p>
                  </div>
                )}
                {contacts.map((c) => (
                  <div key={c.id} className="flex justify-between items-center p-4 bg-slate-800/30 rounded-2xl border border-slate-800/50 hover:border-blue-500/30 hover:bg-slate-800/50 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 flex items-center justify-center font-black text-blue-400 border border-blue-500/20">
                          {c.display_name[0].toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-200">{c.display_name}</div>
                        <div className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">Available</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => initiateCall(c.id, c.display_name)}
                      disabled={callState !== 'idle'}
                      className="p-3 bg-blue-600/10 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50 shadow-lg shadow-blue-600/5"
                    >
                      <Phone size={20} />
                    </button>
                  </div>
                ))}
              </div>
            ) : activeTab === 'history' ? (
              <div className="space-y-3">
                {callLogs.map((log) => {
                  const isCaller = log.caller_id === user.id;
                  const peer = isCaller ? log.callee : log.caller;
                  return (
                    <div key={log.id} className="p-4 bg-slate-800/20 rounded-2xl border border-slate-800/50 flex justify-between items-center group hover:bg-slate-800/40 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${log.status === 'missed' ? 'bg-red-500/10 text-red-500' : 'bg-slate-700/50 text-slate-400'}`}>
                          <History size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-200">{peer?.display_name || 'Anonymous'}</div>
                          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.status}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => initiateCall(peer.id, peer.display_name)} className="text-slate-600 hover:text-blue-400 transition-colors">
                        <Phone size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-8 bg-blue-600/5 rounded-3xl border border-blue-500/10">
                <SettingsIcon size={32} className="mx-auto mb-4 text-blue-500 opacity-50" />
                <p className="text-sm text-slate-400 leading-relaxed">Device settings are open in the main display area for calibration.</p>
              </div>
            )}
          </div>
        </div>

        {/* Call Area */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-600/5 rounded-full blur-[100px] animate-pulse delay-700"></div>

          {activeTab === 'settings' ? (
            <div className="w-full max-w-2xl relative z-10 animate-in zoom-in-95 duration-300">
              <Settings />
            </div>
          ) : callState === 'idle' ? (
            <div className="text-center max-w-sm relative z-10">
              <div className="w-40 h-40 bg-slate-900/50 rounded-[40px] flex items-center justify-center mb-10 mx-auto border border-slate-800 shadow-2xl rotate-12 hover:rotate-0 transition-transform duration-500 group">
                <Phone size={64} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
              </div>
              <h2 className="text-3xl font-black mb-4 tracking-tight">Ready for a Chat?</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Connect with your contacts instantly with crystal-clear voice quality and end-to-end security.</p>
            </div>
          ) : callState === 'calling' ? (
            <div className="text-center relative z-10">
              <div className="relative mb-16">
                <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping duration-[3s]"></div>
                <div className="absolute -inset-8 bg-blue-500/5 rounded-full animate-pulse"></div>
                <div className="relative w-48 h-48 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[60px] flex items-center justify-center mx-auto shadow-[0_20px_50px_rgba(37,99,235,0.3)] border-4 border-slate-950">
                  <UserIcon size={72} className="text-white/90" />
                </div>
              </div>
              <h3 className="text-3xl font-black mb-3">Calling {currentCall?.displayName}</h3>
              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                <span className="text-blue-400 font-black uppercase tracking-[0.3em] text-xs ml-2">Outgoing</span>
              </div>
              <button onClick={endCall} className="mt-16 p-8 bg-red-600 rounded-[32px] hover:bg-red-500 hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-red-900/40 border-b-4 border-red-800">
                <PhoneOff size={40} />
              </button>
            </div>
          ) : callState === 'ringing' ? (
            <div className="text-center relative z-10">
              <div className="relative mb-16">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-pulse duration-700"></div>
                <div className="absolute -inset-10 bg-emerald-500/5 rounded-full animate-ping duration-[2s]"></div>
                <div className="relative w-48 h-48 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[60px] flex items-center justify-center mx-auto shadow-[0_20px_50px_rgba(16,185,129,0.3)] border-4 border-slate-950">
                  <UserIcon size={72} className="text-white/90" />
                </div>
              </div>
              <h3 className="text-3xl font-black mb-3">Incoming Call</h3>
              <p className="text-emerald-400 font-bold mb-16 uppercase tracking-widest">@{currentCall?.from} is calling you</p>
              <div className="flex gap-10 justify-center">
                <button onClick={acceptCall} className="p-8 bg-emerald-600 rounded-[32px] hover:bg-emerald-500 hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-emerald-900/40 border-b-4 border-emerald-800">
                  <Phone size={40} />
                </button>
                <button onClick={rejectCall} className="p-8 bg-red-600 rounded-[32px] hover:bg-red-500 hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-red-900/40 border-b-4 border-red-800">
                  <PhoneOff size={40} />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center w-full max-w-xl bg-slate-900/40 p-12 lg:p-20 rounded-[60px] border border-slate-800/50 backdrop-blur-2xl shadow-2xl relative z-10">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl rotate-12">
                <UserIcon size={40} />
              </div>
              
              <div className="mb-12 mt-4">
                <h3 className="text-4xl font-black mb-4">{currentCall?.displayName || 'In Conversation'}</h3>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-emerald-500 font-black uppercase tracking-[0.4em] text-xs">Secure Link</span>
                </div>
              </div>

              {/* Voice Visualization */}
              <div className="mb-16 flex flex-col items-center gap-4">
                <VoiceVisualizer stream={localStream} isActive={callState === 'connected'} />
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Real-time Audio Data</p>
              </div>
              
              <div className="flex gap-8 justify-center">
                <button 
                  onClick={toggleMute}
                  className={`p-6 rounded-3xl transition-all shadow-xl active:scale-90 border-b-4 ${isMuted ? 'bg-red-500/20 text-red-500 border-red-900/50' : 'bg-slate-800 text-slate-300 border-slate-950'}`}
                >
                  {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
                </button>
                <button onClick={endCall} className="p-6 bg-red-600 rounded-3xl hover:bg-red-500 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-red-900/40 border-b-4 border-red-800">
                  <PhoneOff size={28} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
