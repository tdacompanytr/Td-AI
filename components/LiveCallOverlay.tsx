import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Activity, Volume2, AlertCircle, Loader2 } from 'lucide-react';

interface LiveCallOverlayProps {
  onClose: () => void;
  apiKey: string;
  persona: string;
}

// Audio Utils
const SAMPLE_RATE = 16000;
const AUDIO_FRAME_SIZE = 4096;

function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function floatTo16BitPCM(input: Float32Array) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const LiveCallOverlay: React.FC<LiveCallOverlayProps> = ({ onClose, apiKey, persona }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [aiVolume, setAiVolume] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const frameIntervalRef = useRef<number | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const isCleaningUpRef = useRef(false);

  useEffect(() => {
    const startSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey });
        
        // 1. Setup Audio Output
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass({ sampleRate: 24000 });
        audioContextRef.current = audioCtx;

        // 2. Setup Media Stream (Camera + Mic)
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            channelCount: 1,
            sampleRate: SAMPLE_RATE,
          }, 
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
          } 
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // 3. Connect to Gemini Live
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: persona,
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
          },
          callbacks: {
            onopen: () => {
              console.log('Gemini Live Connected');
              setIsConnected(true);
              setupAudioInput(stream, sessionPromise);
              setupVideoInput(sessionPromise);
            },
            onmessage: async (message: LiveServerMessage) => {
              // Handle Audio Output
              const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData) {
                 await playAudioChunk(audioData);
              }

              // Handle Interruption
              if (message.serverContent?.interrupted) {
                nextStartTimeRef.current = 0;
              }
            },
            onclose: () => {
              console.log('Gemini Live Closed');
              handleCleanup();
            },
            onerror: (err) => {
              console.error('Gemini Live Error', err);
              setError("Bağlantı hatası oluştu.");
            }
          }
        });

        sessionRef.current = sessionPromise;

      } catch (err: any) {
        console.error("Session Start Error:", err);
        setError("Kamera veya Mikrofon izni alınamadı.");
      }
    };

    startSession();

    return () => {
      handleCleanup();
    };
  }, []);

  const setupAudioInput = (stream: MediaStream, sessionPromise: Promise<any>) => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const inputCtx = new AudioContextClass({ sampleRate: SAMPLE_RATE });
    inputAudioContextRef.current = inputCtx;

    const source = inputCtx.createMediaStreamSource(stream);
    sourceNodeRef.current = source;

    // Use ScriptProcessor for raw PCM access (simple approach for streaming)
    const processor = inputCtx.createScriptProcessor(AUDIO_FRAME_SIZE, 1, 1);
    scriptProcessorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (isMicMuted || isCleaningUpRef.current) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = floatTo16BitPCM(inputData);
      const base64Data = arrayBufferToBase64(pcm16.buffer);

      sessionPromise.then((session) => {
        session.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Data
          }
        });
      });
    };

    source.connect(processor);
    processor.connect(inputCtx.destination);
  };

  const setupVideoInput = (sessionPromise: Promise<any>) => {
    // Send frames at ~2 FPS to save bandwidth but provide context
    frameIntervalRef.current = window.setInterval(() => {
      if (isCameraOff || !videoRef.current || !canvasRef.current || isCleaningUpRef.current) return;

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      canvasRef.current.width = videoRef.current.videoWidth / 2; // Downscale for performance
      canvasRef.current.height = videoRef.current.videoHeight / 2;
      
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      
      const base64 = canvasRef.current.toDataURL('image/jpeg', 0.6).split(',')[1];

      sessionPromise.then((session) => {
        session.sendRealtimeInput({
          media: {
            mimeType: 'image/jpeg',
            data: base64
          }
        });
      });
    }, 500); 
  };

  const playAudioChunk = async (base64Audio: string) => {
    if (!audioContextRef.current || isCleaningUpRef.current || audioContextRef.current.state === 'closed') return;
    
    try {
      const audioBytes = base64ToUint8Array(base64Audio);
      
      // Simple visualization mock
      const volume = audioBytes.reduce((a, b) => a + b, 0) / audioBytes.length;
      setAiVolume(Math.min(100, volume));

      // Manual decoding since raw PCM isn't supported by decodeAudioData directly in all contexts
      const float32Data = new Float32Array(audioBytes.length / 2);
      const dataView = new DataView(audioBytes.buffer);
      
      for (let i = 0; i < float32Data.length; i++) {
        // Little endian 16-bit PCM
        const int16 = dataView.getInt16(i * 2, true); 
        float32Data[i] = int16 / 32768.0;
      }

      const audioBuffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      // Schedule playback
      const currentTime = audioContextRef.current.currentTime;
      const start = Math.max(currentTime, nextStartTimeRef.current);
      source.start(start);
      nextStartTimeRef.current = start + audioBuffer.duration;

    } catch (e) {
      // console.error("Audio Playback Error", e); // Suppress common errors during cleanup
    }
  };

  const handleCleanup = () => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;

    if (frameIntervalRef.current) {
        window.clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
    }

    try {
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
    } catch (e) { console.warn("ScriptProcessor disconnect error", e); }

    try {
        if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
    } catch (e) { console.warn("SourceNode disconnect error", e); }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
       audioContextRef.current.close().catch(err => console.warn("Error closing audioContext:", err));
    }
    audioContextRef.current = null;

    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
       inputAudioContextRef.current.close().catch(err => console.warn("Error closing inputAudioContext:", err));
    }
    inputAudioContextRef.current = null;
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const toggleMic = () => {
    setIsMicMuted(!isMicMuted);
  };

  const toggleCamera = () => {
    setIsCameraOff(!isCameraOff);
    // Visually hide locally, logic handles not sending frames
  };

  const handleEndCall = () => {
    handleCleanup();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Video Background */}
      <video 
        ref={videoRef} 
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isCameraOff ? 'opacity-0' : 'opacity-50 blur-sm'}`} 
        muted 
        playsInline 
      />
      
      {/* Hidden Canvas for Frame Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main UI Layer */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full w-full p-8 max-w-md mx-auto">
        
        {/* Header */}
        <div className="w-full flex items-center justify-between">
           <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-xs font-bold text-white tracking-wider">{isConnected ? 'CANLI' : 'BAĞLANIYOR...'}</span>
           </div>
           <div className="bg-black/40 backdrop-blur-md px-3 py-2 rounded-full border border-white/10">
             <span className="text-xs font-mono text-gray-300">Gemini 2.5 Flash</span>
           </div>
        </div>

        {/* Center Visualizer (AI Avatar) */}
        <div className="flex flex-col items-center gap-6">
           <div className="relative">
             {/* Rings Animation based on AI volume */}
             <div className="absolute inset-0 rounded-full border-4 border-red-500/30 animate-ping" style={{ animationDuration: '2s' }}></div>
             <div 
                className="w-32 h-32 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.5)] border-4 border-white/10 transition-transform duration-100"
                style={{ transform: `scale(${1 + aiVolume / 200})` }}
             >
                <Activity size={48} className="text-white animate-pulse" />
             </div>
           </div>
           <h2 className="text-2xl font-bold text-white drop-shadow-lg">Td AI</h2>
           <p className="text-gray-400 text-sm bg-black/50 px-3 py-1 rounded-full">{isConnected ? 'Dinliyor...' : 'Bağlantı kuruluyor...'}</p>
           
           {error && (
             <div className="mt-4 bg-red-900/80 text-white px-4 py-2 rounded-xl flex items-center gap-2">
               <AlertCircle size={16} /> {error}
             </div>
           )}
        </div>

        {/* Local User Preview (PiP) */}
        {!isCameraOff && (
          <div className="absolute bottom-32 right-6 w-24 h-32 md:w-32 md:h-48 bg-gray-900 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
             <video 
                ref={(el) => { if(el && streamRef.current) el.srcObject = streamRef.current; if(el) el.play().catch(() => {}); }}
                className="w-full h-full object-cover mirror-mode" // Add CSS class for mirror if needed
                muted
                playsInline
             />
          </div>
        )}

        {/* Bottom Controls */}
        <div className="flex items-center gap-6 mb-8">
           <button onClick={toggleMic} className={`p-4 rounded-full transition-all duration-300 ${isMicMuted ? 'bg-white text-black' : 'bg-gray-800/60 text-white hover:bg-gray-700 backdrop-blur-md border border-white/10'}`}>
             {isMicMuted ? <MicOff size={24} /> : <Mic size={24} />}
           </button>
           
           <button onClick={handleEndCall} className="p-6 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/40 transition-transform hover:scale-110 active:scale-95">
             <PhoneOff size={32} />
           </button>
           
           <button onClick={toggleCamera} className={`p-4 rounded-full transition-all duration-300 ${isCameraOff ? 'bg-white text-black' : 'bg-gray-800/60 text-white hover:bg-gray-700 backdrop-blur-md border border-white/10'}`}>
             {isCameraOff ? <VideoOff size={24} /> : <Video size={24} />}
           </button>
        </div>

      </div>
    </div>
  );
};