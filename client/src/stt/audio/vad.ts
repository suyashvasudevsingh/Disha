// Simple energy-based VAD with adaptive noise floor
export class SimpleVAD {
  private noiseFloor = 0;
  private alpha = 0.95; // smoothing
  private initialized = false;

  isVoiced(pcm: Int16Array) {
    // compute RMS
    let sum = 0;
    for (let i = 0; i < pcm.length; i++) {
      const v = pcm[i] / 32768;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / pcm.length);

    if (!this.initialized) {
      this.noiseFloor = rms;
      this.initialized = true;
      return rms > this.noiseFloor * 1.5;
    }

    // update noise floor slowly when rms is low
    if (rms < this.noiseFloor) {
      this.noiseFloor = this.alpha * this.noiseFloor + (1 - this.alpha) * rms;
    }

    // voiced if rms significantly above noise floor
    return rms > Math.max(0.005, this.noiseFloor * 1.8);
  }
}

export default SimpleVAD;
