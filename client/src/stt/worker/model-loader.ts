export async function primeModel(w: Worker, modelName: string) {
  try {
    const runtimeUrl = `/models/whisper.js`;
    const modelUrl = `/models/${modelName}.bin`;
    const modelResp = await fetch(modelUrl);
    const runtimeResp = await fetch(runtimeUrl);

    if (modelResp.ok) {
      const fetched = await modelResp.arrayBuffer();
      try {
        w.postMessage({ type: 'loadModelBlob', name: modelName, blob: fetched }, [fetched]);
      } catch {
        w.postMessage({ type: 'loadModelBlob', name: modelName, blob: fetched });
      }
    }

    if (runtimeResp.ok) {
      // Runtime is cached for future browser fetches, but we do not execute it in a module worker.
      return;
    }
  } catch {
    // fallback in worker handles missing runtime/model
  }
}
