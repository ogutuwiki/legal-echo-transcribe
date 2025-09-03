import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Mic, MicOff, Download, Copy, FileText, Loader2, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import TranscriptionService from '@/services/transcriptionService';
import heroImage from '@/assets/legal-hero.jpg';

interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: string;
  speaker?: string;
  confidence?: number;
}

const TranscriptionApp = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isServiceReady, setIsServiceReady] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptionService = TranscriptionService.getInstance();
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  // Fetch user profile
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Initialize transcription service on component mount
  useEffect(() => {
    const initService = async () => {
      try {
        setIsTranscribing(true);
        await transcriptionService.initializeTranscriber();
        setIsServiceReady(true);
        toast({
          title: "AI Model Loaded",
          description: "Transcription service is ready to use.",
        });
      } catch (error) {
        toast({
          title: "Initialization Error", 
          description: "Failed to load AI transcription model. Some features may not work.",
          variant: "destructive",
        });
      } finally {
        setIsTranscribing(false);
      }
    };

    initService();
  }, []);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) throw error;
      
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Sign Out Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "Recording Started",
        description: "Your audio is being recorded for transcription.",
      });
    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      toast({
        title: "Recording Stopped",
        description: "Processing your audio for transcription...",
      });
    }
  }, [isRecording, toast]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an audio or video file.",
        variant: "destructive",
      });
      return;
    }

    await transcribeAudio(file);
  }, [toast]);

  const saveTranscription = async (segments: TranscriptSegment[], audioData: Blob | File) => {
    if (!user) return;

    try {
      const fileName = audioData instanceof File ? audioData.name : `recording-${Date.now()}.wav`;
      const fileSize = audioData.size;
      const duration = Math.round(recordingTime || 0);
      const avgConfidence = segments.reduce((acc, seg) => acc + (seg.confidence || 0), 0) / segments.length;
      const content = segments.map(s => `[${s.timestamp}] ${s.speaker}: ${s.text}`).join('\n\n');

      const { data: transcription, error: transcriptionError } = await supabase
        .from('transcriptions')
        .insert({
          user_id: user.id,
          title: `Transcription - ${new Date().toLocaleDateString()}`,
          content,
          audio_duration: duration,
          speaker_count: [...new Set(segments.map(s => s.speaker))].length,
          confidence_score: avgConfidence,
          file_name: fileName,
          file_size: fileSize,
        })
        .select()
        .single();

      if (transcriptionError) throw transcriptionError;

      // Save individual segments
      const segmentInserts = segments.map((segment, index) => ({
        transcription_id: transcription.id,
        speaker_label: segment.speaker || 'Unknown',
        text_content: segment.text,
        confidence_score: segment.confidence || 0,
        segment_order: index + 1,
      }));

      const { error: segmentsError } = await supabase
        .from('transcription_segments')
        .insert(segmentInserts);

      if (segmentsError) throw segmentsError;

      toast({
        title: "Transcription Saved",
        description: "Your transcription has been saved to your account.",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Error",
        description: "Failed to save transcription. You can still download it.",
        variant: "destructive",
      });
    }
  };

  const transcribeAudio = useCallback(async (audioData: Blob | File) => {
    if (!isServiceReady) {
      toast({
        title: "Service Not Ready",
        description: "Please wait for the AI model to finish loading.",
        variant: "destructive",
      });
      return;
    }

    setIsTranscribing(true);
    
    try {
      const segments = await transcriptionService.transcribeWithSpeakerDetection(audioData);
      setTranscripts(prev => [...prev, ...segments]);
      
      // Save to database
      await saveTranscription(segments, audioData);
      
      toast({
        title: "Transcription Complete",
        description: `Successfully transcribed ${segments.length} segments with speaker identification.`,
      });
    } catch (error) {
      console.error('Transcription error:', error);
      
      // Fallback to mock transcription if AI fails
      const mockTranscript: TranscriptSegment = {
        id: Date.now().toString(),
        text: "AI transcription temporarily unavailable. This is a mock transcription. Please try again or check your audio quality.",
        timestamp: new Date().toLocaleTimeString(),
        speaker: "System",
        confidence: 0.0
      };

      setTranscripts(prev => [...prev, mockTranscript]);
      
      toast({
        title: "Transcription Error",
        description: "AI transcription failed, showing mock result. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  }, [isServiceReady, transcriptionService, toast, user, recordingTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyTranscript = useCallback(() => {
    const fullTranscript = transcripts.map(t => 
      `[${t.timestamp}] ${t.speaker}${t.confidence ? ` (${(t.confidence * 100).toFixed(0)}%)` : ''}: ${t.text}`
    ).join('\n\n');
    navigator.clipboard.writeText(fullTranscript);
    toast({
      title: "Copied to Clipboard",
      description: "Full transcript has been copied to your clipboard.",
    });
  }, [transcripts, toast]);

  const downloadTranscript = useCallback(() => {
    const fullTranscript = transcripts.map(t => 
      `[${t.timestamp}] ${t.speaker}${t.confidence ? ` (${(t.confidence * 100).toFixed(0)}%)` : ''}: ${t.text}`
    ).join('\n\n');
    const blob = new Blob([fullTranscript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legal-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: "Your transcript is being downloaded.",
    });
  }, [transcripts, toast]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-primary/80"></div>
        </div>
        <div className="relative container mx-auto px-4 py-20">
          {/* User Info Header */}
          <div className="flex justify-between items-center mb-8">
            <div></div>
            <div className="flex items-center gap-4">
              {userProfile && (
                <div className="text-right text-primary-foreground">
                  <p className="font-medium">{userProfile.full_name}</p>
                  <p className="text-sm text-primary-foreground/80">{userProfile.title}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              Legal Transcription Suite
            </h1>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Professional audio and video transcription for legal proceedings, 
              hearings, and case documentation. Powered by advanced AI with 
              speaker identification and timestamp accuracy.
            </p>
            {!isServiceReady && (
              <div className="flex items-center justify-center gap-2 text-primary-foreground/80">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading AI transcription model...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main App */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recording Controls */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Live Recording
              </CardTitle>
              <CardDescription>
                Record audio directly from your microphone for real-time transcription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                {isRecording && (
                  <div className="text-2xl font-mono text-destructive mb-4">
                    {formatTime(recordingTime)}
                  </div>
                )}
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? "record" : "professional"}
                  size="xl"
                  className="mb-4"
                  disabled={isTranscribing || !isServiceReady}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-6 w-6" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-6 w-6" />
                      Start Recording
                    </>
                  )}
                </Button>
                {!isServiceReady && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Waiting for AI model to load...
                  </p>
                )}
              </div>
              
              {isRecording && (
                <div className="flex justify-center">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-8 bg-destructive rounded-full animate-pulse`}
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                File Upload
              </CardTitle>
              <CardDescription>
                Upload audio or video files for transcription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={isTranscribing || !isServiceReady}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    Drop your audio or video file here
                  </p>
                  <p className="text-muted-foreground">
                    Supports MP3, WAV, MP4, and other common formats
                  </p>
                  <Button 
                    variant="accent" 
                    className="mt-4" 
                    disabled={isTranscribing || !isServiceReady}
                  >
                    {!isServiceReady ? "Loading AI Model..." : "Choose File"}
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transcription Results */}
        {(transcripts.length > 0 || isTranscribing) && (
          <Card className="mt-8 shadow-strong">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <CardTitle>Transcription Results</CardTitle>
                </div>
                {transcripts.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      onClick={copyTranscript}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      onClick={downloadTranscript}
                      variant="accent"
                      size="sm"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isTranscribing && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-muted-foreground">
                    {!isServiceReady ? "Loading AI model..." : "Transcribing audio with AI..."}
                  </span>
                </div>
              )}
              
              <div className="space-y-4">
                {transcripts.map((transcript) => (
                  <div
                    key={transcript.id}
                    className="border rounded-lg p-4 bg-card hover:shadow-soft transition-shadow"
                  >
                    <div className="flex items-center gap-4 mb-2 text-sm text-muted-foreground">
                      <span className="font-medium text-accent">
                        {transcript.speaker}
                      </span>
                      <span>{transcript.timestamp}</span>
                      {transcript.confidence && transcript.confidence > 0 && (
                        <span className="bg-accent-muted px-2 py-1 rounded text-xs">
                          {(transcript.confidence * 100).toFixed(0)}% confidence
                        </span>
                      )}
                    </div>
                    <p className="text-card-foreground leading-relaxed">
                      {transcript.text}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TranscriptionApp;