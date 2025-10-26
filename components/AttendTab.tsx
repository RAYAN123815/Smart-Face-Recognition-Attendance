import React, { useState, useRef, useEffect } from 'react';
import { User, AttendanceRecord } from '../types';
import { verifyUserWithAi } from '../services/geminiService';

interface AttendTabProps {
  users: User[];
  attendance: AttendanceRecord[];
  onMarkAttendance: (record: Omit<AttendanceRecord, 'id'>) => void;
}

// Updated steps for the new AI verification flow
type RecognitionStep = 'idle' | 'camera_on' | 'verifying' | 'success' | 'failure';

const AttendTab: React.FC<AttendTabProps> = ({ users, attendance, onMarkAttendance }) => {
  const [status, setStatus] = useState<string>("Ready to mark attendance.");
  const [step, setStep] = useState<RecognitionStep>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCapture, setLastCapture] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setStep('camera_on');
      setStatus("Camera is active. Look at the camera and capture.");
    } catch (err) {
      console.error("Camera access denied:", err);
      setError("Camera access is required. Please enable it in your browser settings.");
      setStep('idle');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setStep('idle');
    setLastCapture(null);
    setStatus("Ready to mark attendance.");
  };

  useEffect(() => {
    return () => { // Cleanup on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  
  const handleCaptureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError("Component not ready.");
      return;
    }
    
    // 1. Capture image
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const imageUrl = canvas.toDataURL('image/jpeg');
    setLastCapture(imageUrl);

    // 2. Start verification with AI
    setStep('verifying');
    setStatus("Verifying with AI... This may take a moment.");

    if (users.length === 0) {
        setStatus("No users registered. Please register first.");
        setStep('failure');
        return;
    }
    
    const matchedUser = await verifyUserWithAi(imageUrl, users);

    if (matchedUser) {
        const today = new Date();
        const hasAttendedToday = attendance.some(rec => 
            rec.userId === matchedUser.id && new Date(rec.timestamp).toDateString() === today.toDateString()
        );

        if (hasAttendedToday) {
            setStatus(`✅ ${matchedUser.name} has already marked attendance today.`);
        } else {
            const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
            const newRecord: Omit<AttendanceRecord, 'id'> = {
                userId: matchedUser.id,
                name: matchedUser.name,
                day: dayOfWeek,
                timestamp: today.toISOString(),
                status: "Present",
            };
            onMarkAttendance(newRecord);
            setStatus(`✅ Welcome, ${matchedUser.name}! Attendance marked.`);
        }
        setStep('success');
    } else {
        setStatus("❌ Verification Failed. Face not recognized by AI.");
        setStep('failure');
    }
  };
  
  const handleTryAgain = () => {
    setStep('camera_on');
    setLastCapture(null);
    setStatus("Camera is active. Look at the camera and capture.");
    setError(null);
  };
  
  const renderContent = () => {
    switch(step) {
      case 'idle':
        return (
          <>
            <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center">
              <div className="text-gray-400">Camera is off</div>
            </div>
            <button 
              onClick={startCamera} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
              Start Camera
            </button>
          </>
        );
      case 'camera_on':
        return (
          <>
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden animate-pulse-camera">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                  onClick={handleCaptureAndVerify} 
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                  Verify My Face
              </button>
              <button 
                  onClick={stopCamera} 
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                  Stop Camera
              </button>
            </div>
          </>
        );
      case 'verifying':
        return (
          <div className="relative w-full aspect-video bg-black rounded-lg flex flex-col items-center justify-center space-y-4 overflow-hidden">
             {lastCapture && (
                <img src={lastCapture} alt="Verifying face" className="absolute top-0 left-0 w-full h-full object-cover filter blur-md" />
             )}
             <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center space-y-4 z-10">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
                <p className="text-lg text-white drop-shadow-lg">Verifying with AI...</p>
             </div>
          </div>
        );
      case 'success':
         return (
          <div className="w-full aspect-video bg-black rounded-lg flex flex-col items-center justify-center space-y-4 text-center">
             <svg className="w-16 h-16 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <p className="text-lg text-green-400">{status}</p>
             <button onClick={stopCamera} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                Done
             </button>
          </div>
        );
      case 'failure':
         return (
          <div className="w-full aspect-video bg-black rounded-lg flex flex-col items-center justify-center space-y-4 text-center">
             <svg className="w-16 h-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <p className="text-lg text-red-400">{status}</p>
             <button onClick={handleTryAgain} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                Try Again
             </button>
          </div>
        );
      default:
        return null;
    }
  }
  
  return (
    <div className="p-4 md:p-6 bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">Mark Attendance</h2>
      <div className="space-y-4">
        {renderContent()}
        <canvas ref={canvasRef} className="hidden"></canvas>

        {error && <p className="text-red-400 mt-2 text-center">{error}</p>}
        <div className="bg-gray-700 p-3 rounded-md text-center">
          <p className="text-lg">{status}</p>
        </div>
      </div>
    </div>
  );
};

export default AttendTab;