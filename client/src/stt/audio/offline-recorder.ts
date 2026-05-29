type ChunkCallback = (pcm16: Int16Array, sampleRate: number, chunkIndex: number) => void;

export class OfflineRecorder {
  private audioCtx: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private chunkCallback: ChunkCallback;
  private chunkIndex = 0;
  private readonly desiredSampleRate = 16000;
  private readonly frameSamples = 16000 * 0.25; // 250ms frames

  constructor(chunkCallback: ChunkCallback) {
    this.chunkCallback = chunkCallback;
  }

  async start() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('getUserMedia not supported');
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioCtx();
    this.source = this.audioCtx.createMediaStreamSource(this.stream);

    const bufferSize = 4096; // moderate latency
    this.processor = this.audioCtx.createScriptProcessor(bufferSize, 1, 1);

    let frameBuf = new Int16Array(0);
    this.processor.onaudioprocess = (ev) => {
      const input = ev.inputBuffer.getChannelData(0);
      // resample to desiredSampleRate if needed
      const pcm16 = this.floatTo16BitPCM(input, this.audioCtx!.sampleRate, this.desiredSampleRate);
      // accumulate to frameSamples and emit frames
      const combined = new Int16Array(frameBuf.length + pcm16.length);
      combined.set(frameBuf, 0);
      combined.set(pcm16, frameBuf.length);
      let offset = 0;
      while (offset + this.frameSamples <= combined.length) {
        const frame = combined.subarray(offset, offset + this.frameSamples);
        this.chunkCallback(frame, this.desiredSampleRate, this.chunkIndex++);
        offset += this.frameSamples;
      }
      frameBuf = combined.subarray(offset);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioCtx.destination);
  }

  stop() {
    try {
      this.processor?.disconnect();
      this.source?.disconnect();
      this.stream?.getTracks().forEach((t) => t.stop());
      this.audioCtx?.close();
    } finally {
      this.processor = null;
      this.source = null;
      this.stream = null;
      this.audioCtx = null;
    }
  }

  private floatTo16BitPCM(float32Array: Float32Array, srcRate: number, dstRate: number) {
    if (srcRate === dstRate) {
      const out = new Int16Array(float32Array.length);
      for (let i = 0; i < float32Array.length; i++) {
        let s = Math.max(-1, Math.min(1, float32Array[i]));
        out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return out;
    }

    const ratio = srcRate / dstRate;
    const outLength = Math.round(float32Array.length / ratio);
    const out = new Int16Array(outLength);
    for (let i = 0; i < outLength; i++) {
      const idx = Math.floor(i * ratio);
      let s = float32Array[idx];
      s = Math.max(-1, Math.min(1, s));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  }
}

export default OfflineRecorder;
