import SimpleVAD from './vad';

export type Chunk = { id: string; pcm: Int16Array; sampleRate: number; startMs: number; endMs: number };

export class Chunker {
  private buffer: Int16Array[] = [];
  private bufferSamples = 0;
  private readonly chunkSizeSamples: number;
  private readonly overlapSamples: number;
  private readonly sampleRate: number;
  private vad = new SimpleVAD();
  private chunkIndex = 0;

  constructor(sampleRate = 16000, chunkSeconds = 4, overlapSeconds = 0.5) {
    this.sampleRate = sampleRate;
    this.chunkSizeSamples = Math.floor(chunkSeconds * sampleRate);
    this.overlapSamples = Math.floor(overlapSeconds * sampleRate);
  }

  push(pcm: Int16Array): Chunk[] {
    // append
    this.buffer.push(pcm);
    this.bufferSamples += pcm.length;

    const out: Chunk[] = [];
    while (this.bufferSamples >= this.chunkSizeSamples) {
      // gather chunkSizeSamples
      const chunk = new Int16Array(this.chunkSizeSamples);
      let offset = 0;
      while (offset < this.chunkSizeSamples && this.buffer.length) {
        const head = this.buffer[0];
        const take = Math.min(head.length, this.chunkSizeSamples - offset);
        chunk.set(head.subarray(0, take), offset);
        if (take < head.length) {
          this.buffer[0] = head.subarray(take);
        } else {
          this.buffer.shift();
        }
        offset += take;
      }
      this.bufferSamples -= this.chunkSizeSamples;

      // compute startMs/endMs
      const startMs = Math.round((this.chunkIndex * (this.chunkSizeSamples - this.overlapSamples) / this.sampleRate) * 1000);
      const endMs = Math.round(((this.chunkIndex * (this.chunkSizeSamples - this.overlapSamples) + this.chunkSizeSamples) / this.sampleRate) * 1000);

      // run VAD quick check; if mostly silent, skip
      const voiced = this.vad.isVoiced(chunk);
      if (voiced) {
        out.push({ id: `${Date.now()}-${this.chunkIndex}`, pcm: chunk, sampleRate: this.sampleRate, startMs, endMs });
      }

      // keep overlapSamples at start of buffer by prepending overlap
      if (this.overlapSamples > 0) {
        const overlap = chunk.subarray(this.chunkSizeSamples - this.overlapSamples);
        this.buffer.unshift(overlap);
        this.bufferSamples += overlap.length;
      }

      this.chunkIndex++;
    }

    return out;
  }
}

export default Chunker;
