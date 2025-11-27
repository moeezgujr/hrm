import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, Play, Pause, Square, Volume2, RotateCcw } from "lucide-react";

interface VoiceRecorderProps {
  onRecordingComplete: (audioData: string) => void;
  existingRecording?: string;
}

export function VoiceRecorder({ onRecordingComplete, existingRecording }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingPermission, setRecordingPermission] = useState<boolean | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    // Set initial permission to null to allow user to try
    setRecordingPermission(null);
      
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      streamRef.current = stream;
      
      // Check for MediaRecorder support and available mimeTypes
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser choose
          }
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        setAudioBlob(blob);
        
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          onRecordingComplete(base64String);
        };
        reader.readAsDataURL(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Recording Started",
        description: "Speak clearly into your microphone. Maximum 2 minutes.",
      });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setRecordingPermission(false);
      
      let errorMessage = "Could not access microphone. ";
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage += "Please allow microphone access when prompted.";
            break;
          case 'NotFoundError':
            errorMessage += "No microphone found. Please connect a microphone.";
            break;
          case 'NotSupportedError':
            errorMessage += "Recording not supported on this device.";
            break;
          case 'NotReadableError':
            errorMessage += "Microphone is already in use by another application.";
            break;
          default:
            errorMessage += `Error: ${error.message}`;
        }
      } else {
        errorMessage += "Unknown error occurred.";
      }
      
      toast({
        title: "Recording Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      toast({
        title: "Recording Completed",
        description: `Recorded ${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}`,
      });
    }
  };

  const playRecording = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
      setIsPlaying(true);
    }
  };

  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
    onRecordingComplete("");
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    toast({
      title: "Recording Reset",
      description: "You can now record a new introduction.",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show permission error only if we've explicitly failed
  if (recordingPermission === false) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <MicOff className="w-5 h-5" />
            Microphone Access Required
          </CardTitle>
          <CardDescription className="text-red-600">
            {!navigator.mediaDevices 
              ? "Voice recording requires HTTPS or localhost. Please ensure you're on a secure connection."
              : "Please allow microphone access to record your voice introduction. Click the button below to try again."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => {
              setRecordingPermission(null);
              navigator.mediaDevices.getUserMedia({ audio: true })
                .then((stream) => {
                  setRecordingPermission(true);
                  stream.getTracks().forEach(track => track.stop());
                })
                .catch(() => setRecordingPermission(false));
            }} 
            variant="outline" 
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            {!navigator.mediaDevices ? "Check Connection" : "Retry Microphone Access"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Mic className="w-5 h-5" />
          Voice Introduction
        </CardTitle>
        <CardDescription className="text-blue-600">
          Record a 30-60 second personal introduction. Tell us about yourself, your passion, and why you're excited about this opportunity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Status */}
        {isRecording && (
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 mb-2">
              🔴 Recording: {formatTime(recordingTime)}
            </div>
            <Progress value={(recordingTime / 120) * 100} className="mb-2" />
            <p className="text-sm text-gray-600">Maximum 2 minutes</p>
          </div>
        )}

        {/* Recording Controls */}
        <div className="flex items-center justify-center gap-3">
          {!isRecording && !audioBlob && (
            <Button
              onClick={startRecording}
              disabled={recordingPermission === false}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <Button
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop Recording
            </Button>
          )}

          {audioBlob && !isRecording && (
            <>
              <Button
                onClick={isPlaying ? pausePlayback : playRecording}
                variant="outline"
                size="lg"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 mr-2" />
                ) : (
                  <Play className="w-5 h-5 mr-2" />
                )}
                {isPlaying ? "Pause" : "Play"}
              </Button>
              
              <Button
                onClick={resetRecording}
                variant="outline"
                size="lg"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Re-record
              </Button>
            </>
          )}
        </div>

        {/* Recording Info */}
        {audioBlob && !isRecording && (
          <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <Volume2 className="w-5 h-5" />
              <span className="font-medium">
                Recording completed: {formatTime(recordingTime)}
              </span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Great! Your voice introduction is ready. You can play it back or re-record if needed.
            </p>
          </div>
        )}

        {/* Recording Tips */}
        {!audioBlob && !isRecording && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-2">💡 Recording Tips:</p>
            <ul className="space-y-1 text-xs">
              <li>• Find a quiet environment</li>
              <li>• Speak clearly and at a normal pace</li>
              <li>• Introduce yourself and your background</li>
              <li>• Share what excites you about this role</li>
              <li>• Keep it between 30-60 seconds</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}