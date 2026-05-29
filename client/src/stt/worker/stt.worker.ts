/* eslint-disable no-restricted-globals */
type MsgInit = { type: 'init' };
type MsgLoadModel = { type: 'loadModel'; modelName: string };
type MsgLoadModelBlob = { type: 'loadModelBlob'; name: string; blob: ArrayBuffer };
type MsgLoadWasmRuntime = { type: 'loadWasmRuntime'; scriptUrl: string; modelName: string; modelBuffer: ArrayBuffer };
type MsgAudio = { type: 'audio'; pcm16: Int16Array; sampleRate: number; chunkIndex: number };

let modelLoaded = false;
let whisperRuntime: any = null;

function runtimeAvailable() {
  return whisperRuntime !== null;
}

function mockTranscribe(pcm: Int16Array, idx: number) {
  // simple mock: return placeholder text based on index
  const words = ['hello', 'this', 'is', 'a', 'mock', 'transcript', 'from', 'whisper', 'cpp'];
  const text = words.slice(0, Math.max(1, (idx % words.length) + 1)).join(' ');
  return text + (idx % 3 === 0 ? '.' : '');
}

self.addEventListener('message', async (ev) => {
  const data = ev.data as MsgInit | MsgLoadModel | MsgLoadModelBlob | MsgLoadWasmRuntime | MsgAudio;
  if (data.type === 'init') {
    // initialize worker
    self.postMessage({ type: 'ready' });
    return;
  }

  if (data.type === 'loadModel') {
    // Try to load model/runtime directly from CacheStorage (models-cache-v1) for offline-first
    const modelName = data.modelName;
    const modelUrl = `/models/${modelName}.bin`;
    try {
      const cache = await caches.open('models-cache-v1');
      const modelResp = await cache.match(modelUrl);
      if (modelResp) {
        const modelAb = await modelResp.arrayBuffer();
        (self as any).__modelBlob = modelAb;
        modelLoaded = true;
        self.postMessage({ type: 'modelLoaded', modelName, wasm: false, source: 'cache' });
        return;
      }
    } catch (err) {
      // ignore cache errors and fall back to main-thread supplied blobs
    }

    // main thread will supply model blob via loadModelBlob; worker can ack
    self.postMessage({ type: 'loadRequested', modelName: data.modelName });
    return;
  }

  if (data.type === 'loadModelBlob') {
    // Attempt to instantiate if this is a wasm module; otherwise accept as model blob
    try {
      const ab = data.blob as ArrayBuffer;
      // try instantiate as WASM
      if (typeof WebAssembly !== 'undefined') {
        try {
          const mod = await WebAssembly.instantiate(ab, {} as any);
          // store module export reference if needed (placeholder)
          // @ts-ignore
          (self as any).__wasmModule = mod;
          modelLoaded = true;
          self.postMessage({ type: 'modelLoaded', modelName: data.name, wasm: true });
          return;
        } catch (wasmErr) {
          // not a wasm runtime; treat as model blob
        }
      }
      // fallback: accept model blob (e.g., ggml) for later native wasm runtime
      // Store in worker memory if needed
      // @ts-ignore
      (self as any).__modelBlob = ab;
      modelLoaded = true;
      self.postMessage({ type: 'modelLoaded', modelName: data.name, wasm: false });
      return;
    } catch (err) {
      self.postMessage({ type: 'error', message: String(err) });
      return;
    }
  }

  if (data.type === 'loadWasmRuntime') {
    const { scriptUrl, modelName, modelBuffer } = data as MsgLoadWasmRuntime;
    try {
      // import runtime script (Emscripten build should expose Module factory)
      (self as any).importScripts(scriptUrl);
      // Module should now be available in scope. Try to instantiate with wasmBinary
      const ModuleFactory = (self as any).Module || (self as any).createModule || null;
      if (typeof ModuleFactory === 'function') {
        const moduleInstance = ModuleFactory({ wasmBinary: modelBuffer, noInitialRun: true });
        // If the runtime provides an API for transcription, keep reference
        whisperRuntime = moduleInstance;
        modelLoaded = true;
        self.postMessage({ type: 'modelLoaded', modelName, wasm: true });
        return;
      }

      // If ModuleFactory not found, still store modelBuffer for later
      (self as any).__modelBlob = modelBuffer;
      modelLoaded = true;
      self.postMessage({ type: 'modelLoaded', modelName, wasm: false });
      return;
    } catch (err) {
      self.postMessage({ type: 'error', message: 'wasm-runtime-load-failed:' + String(err) });
      return;
    }
  }

  if (data.type === 'audio') {
    if (!modelLoaded) {
      self.postMessage({ type: 'error', message: 'model-not-loaded' });
      return;
    }
    // If a real runtime is available, try to call its API
    try {
      if (runtimeAvailable() && typeof whisperRuntime.transcribe === 'function') {
        // runtime-specific API: transcribe expects PCM Int16Array and returns string
        const text = whisperRuntime.transcribe(data.pcm16, data.sampleRate, data.chunkIndex);
        self.postMessage({ type: 'partial', text: String(text).slice(0, 80) + ' (interim)', chunkIndex: data.chunkIndex });
        const final = String(text);
        self.postMessage({ type: 'result', text: final, chunkIndex: data.chunkIndex });
        return;
      }
    } catch (err) {
      // fallthrough to mock
      self.postMessage({ type: 'error', message: 'runtime-transcribe-failed:' + String(err) });
    }

    // Fallback/mock behavior if runtime not available or doesn't provide expected API
    const interim = mockTranscribe(data.pcm16, data.chunkIndex) + ' (interim)';
    self.postMessage({ type: 'partial', text: interim, chunkIndex: data.chunkIndex });

    // simulate longer processing
    await new Promise((r) => setTimeout(r, 250));
    const finalText = mockTranscribe(data.pcm16, data.chunkIndex) + ' (final)';
    self.postMessage({ type: 'result', text: finalText, chunkIndex: data.chunkIndex });
  }
});

export {};
