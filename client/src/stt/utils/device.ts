export type DeviceClass = 'low' | 'medium' | 'high';

export function detectDeviceClass(): DeviceClass {
  // Prefer navigator.deviceMemory when available (in GB)
  const deviceMemory = (navigator as any).deviceMemory || 0;
  const hw = navigator.hardwareConcurrency || 1;

  // simple heuristic
  if (deviceMemory >= 8 || hw >= 8) return 'high';
  if (deviceMemory >= 4 || hw >= 4) return 'medium';
  return 'low';
}

export function recommendedModelForDevice(d: DeviceClass) {
  // map to model names used by the app
  if (d === 'high') return 'small-multilingual';
  if (d === 'medium') return 'tiny-multilingual';
  return 'tiny-mock';
}

export function recommendedChunkParams(d: DeviceClass) {
  // chunkSeconds, overlapSeconds
  if (d === 'high') return { chunkSeconds: 6, overlapSeconds: 0.5 };
  if (d === 'medium') return { chunkSeconds: 4, overlapSeconds: 0.6 };
  return { chunkSeconds: 2.5, overlapSeconds: 0.7 };
}

export default detectDeviceClass;
