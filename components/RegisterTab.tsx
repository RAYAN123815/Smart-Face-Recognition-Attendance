import React, { useState, useRef, useEffect } from 'react';
import { User, Angle } from '../types';

interface RegisterTabProps {
  onRegister: (user: User) => void;
  users: User[];
}

const ANGLES: { tag: Angle; instruction: string }[] = [
  { tag: "front", instruction: "Look straight at the camera" },
  { tag: "left", instruction: "Slowly turn your head to the LEFT" },
  { tag: "right", instruction: "Slowly turn your head to the RIGHT" },
];

const RegisterTab: React.FC<RegisterTabProps> = ({ onRegister, users }) => {
  const [regName, setRegName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
  const [capturedImages, setCapturedImages] = useState<Partial<Record<Angle, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
    } catch (err) {
      console.error("Camera access denied:", err);
      setError("Camera access is required. Please enable it in your browser settings.");
    }
  };

  useEffect(() => {
    if (isRegistering) {
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRegistering]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  
  const handleStartRegistration = () => {
    const trimmedName = regName.trim();
    if (!trimmedName) {
      setError("Please enter a valid name.");
      return;
    }
    if (users.some(u => u.name.toLowerCase() === trimmedName.toLowerCase())) {
        setError("This name is already registered. Please choose a different one.");
        return;
    }
    setError(null);
    setIsRegistering(true);
    setCurrentAngleIndex(0);
    setCapturedImages({});
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const imageUrl = canvas.toDataURL('image/jpeg');
      
      const currentAngle = ANGLES[currentAngleIndex].tag;
      const newImages = { ...capturedImages, [currentAngle]: imageUrl };
      setCapturedImages(newImages);

      if (currentAngleIndex < ANGLES.length - 1) {
        setCurrentAngleIndex(currentAngleIndex + 1);
      } else {
        // Registration complete
        const newUser: User = {
          id: Date.now().toString(),
          name: regName.trim(),
          // Fix: The type assertion `Required<typeof newImages>` was failing because `typeof newImages` was being inferred as `any`.
          // Using `User['images']` is a more direct and robust way to cast the type, as we are certain at this point
          // that `newImages` has the correct shape.
          images: newImages as User['images'],
        };
        onRegister(newUser);
        setIsRegistering(false);
        setRegName('');
      }
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">Register New User</h2>
      {!isRegistering ? (
        <div className="space-y-4 max-w-md">
          <input
            type="text"
            value={regName}
            onChange={(e) => setRegName(e.target.value)}
            placeholder="Enter full name"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            onClick={handleStartRegistration}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
          >
            Start Registration
          </button>
          {error && <p className="text-red-400 mt-2">{error}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-700 p-3 rounded-md text-center">
            <h3 className="text-xl font-semibold">{ANGLES[currentAngleIndex].instruction}</h3>
          </div>
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
             <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
          </div>
          <canvas ref={canvasRef} className="hidden"></canvas>
          <button
            onClick={captureImage}
            disabled={!stream}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Capture {ANGLES[currentAngleIndex].tag.charAt(0).toUpperCase() + ANGLES[currentAngleIndex].tag.slice(1)}
          </button>
          <div className="flex justify-center space-x-4 mt-4">
            {ANGLES.map(({ tag }) => (
              <div key={tag} className="text-center">
                <div className={`w-24 h-24 rounded-lg bg-gray-700 flex items-center justify-center overflow-hidden border-2 ${capturedImages[tag] ? 'border-green-500' : 'border-gray-500'}`}>
                  {capturedImages[tag] ? (
                    <img src={capturedImages[tag]} alt={`${tag} capture`} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-sm">Waiting...</span>
                  )}
                </div>
                <p className="mt-1 text-sm">{tag.charAt(0).toUpperCase() + tag.slice(1)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterTab;