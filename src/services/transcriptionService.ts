import { pipeline } from '@huggingface/transformers';

class TranscriptionService {
  private static instance: TranscriptionService;
  private transcriber: any = null;
  private isLoading = false;

  static getInstance(): TranscriptionService {
    if (!TranscriptionService.instance) {
      TranscriptionService.instance = new TranscriptionService();
    }
    return TranscriptionService.instance;
  }

  async initializeTranscriber(): Promise<void> {
    if (this.transcriber || this.isLoading) {
      return;
    }

    this.isLoading = true;
    try {
      // Initialize Whisper model for automatic speech recognition
      this.transcriber = await pipeline(
        'automatic-speech-recognition',
        'onnx-community/whisper-tiny.en',
        { device: 'webgpu' }
      );
      console.log('Transcription service initialized successfully');
    } catch (error) {
      console.warn('WebGPU not available, falling back to CPU:', error);
      try {
        // Fallback to CPU if WebGPU is not available
        this.transcriber = await pipeline(
          'automatic-speech-recognition',
          'onnx-community/whisper-tiny.en'
        );
      } catch (cpuError) {
        console.error('Failed to initialize transcription service:', cpuError);
        throw new Error('Unable to initialize transcription service');
      }
    } finally {
      this.isLoading = false;
    }
  }

  async transcribeAudio(audioData: Blob | File): Promise<{
    text: string;
    timestamp: string;
    chunks?: Array<{ text: string; timestamp: [number, number] }>;
  }> {
    try {
      // Initialize transcriber if not already done
      if (!this.transcriber) {
        await this.initializeTranscriber();
      }

      // Convert audio data to the format expected by the pipeline
      let audioInput: string | Blob = audioData;

      // If it's a File, we can use it directly
      // The pipeline should handle common audio formats
      if (audioData instanceof File) {
        audioInput = audioData;
      }

      // Perform transcription
      const result = await this.transcriber(audioInput, {
        return_timestamps: true,
        chunk_length_s: 30, // Process in 30-second chunks
        stride_length_s: 5   // 5-second overlap between chunks
      });

      // Format the result
      const formattedResult = {
        text: result.text || 'No speech detected',
        timestamp: new Date().toLocaleTimeString(),
        chunks: result.chunks || []
      };

      return formattedResult;
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Method to detect speech segments and identify potential speakers
  async transcribeWithSpeakerDetection(audioData: Blob | File): Promise<Array<{
    id: string;
    text: string;
    timestamp: string;
    speaker: string;
    confidence?: number;
  }>> {
    try {
      const result = await this.transcribeAudio(audioData);
      
      // For now, we'll simulate speaker detection
      // In a production app, you'd use additional models for speaker diarization
      const segments = this.simulateSpeakerDetection(result.text, result.chunks);
      
      return segments;
    } catch (error) {
      console.error('Speaker detection error:', error);
      throw error;
    }
  }

  private simulateSpeakerDetection(fullText: string, chunks: any[]): Array<{
    id: string;
    text: string;
    timestamp: string;
    speaker: string;
    confidence?: number;
  }> {
    // Simple simulation - in production, use proper speaker diarization
    const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const speakers = ['Attorney', 'Judge', 'Witness', 'Court Reporter'];
    
    return sentences.map((sentence, index) => ({
      id: `segment-${Date.now()}-${index}`,
      text: sentence.trim(),
      timestamp: new Date(Date.now() + index * 1000).toLocaleTimeString(),
      speaker: speakers[index % speakers.length],
      confidence: 0.85 + Math.random() * 0.1 // Simulate confidence score
    }));
  }

  // Check if the service is ready
  isReady(): boolean {
    return this.transcriber !== null && !this.isLoading;
  }

  // Get loading status
  isInitializing(): boolean {
    return this.isLoading;
  }
}

export default TranscriptionService;