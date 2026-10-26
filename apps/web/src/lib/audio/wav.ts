/** Sample rate Muse Voice Transcribe accepts (16 kHz or 24 kHz). */
export const MUSE_SAMPLE_RATE = 16_000;

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

/** Encodes mono float samples as a 16-bit PCM RIFF/WAVE blob. */
export function encodeWav(
  samples: Float32Array,
  sampleRate = MUSE_SAMPLE_RATE
): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");

  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);

  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(
      offset,
      sample < 0 ? sample * 0x8000 : sample * 0x7fff,
      true
    );
  }

  return new Blob([view], { type: "audio/wav" });
}

/**
 * Decodes a browser recording (webm/opus, mp4/aac, ogg, …) and re-encodes it
 * as the mono 16 kHz 16-bit PCM WAV that Meta's file transcription endpoint
 * requires.
 */
export async function toMuseWav(
  blob: Blob,
  targetRate = MUSE_SAMPLE_RATE
): Promise<Blob> {
  const AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextCtor) {
    throw new Error("Audio decoding is not supported in this browser");
  }

  const decodeContext = new AudioContextCtor();
  let decoded: AudioBuffer;
  try {
    decoded = await decodeContext.decodeAudioData(await blob.arrayBuffer());
  } finally {
    void decodeContext.close().catch(() => {});
  }

  const length = Math.max(1, Math.ceil(decoded.duration * targetRate));
  const OfflineCtor =
    window.OfflineAudioContext ??
    (
      window as unknown as {
        webkitOfflineAudioContext?: typeof OfflineAudioContext;
      }
    ).webkitOfflineAudioContext;
  if (!OfflineCtor) {
    throw new Error("Audio resampling is not supported in this browser");
  }

  const offline = new OfflineCtor(1, length, targetRate);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();

  const rendered = await offline.startRendering();
  return encodeWav(rendered.getChannelData(0), targetRate);
}
