export type ActiveRecording = {
  /** Stops and resolves the recorded audio (webm/opus or mp4/aac). */
  stop: () => Promise<Blob>;
  /** Stops and discards the recording. */
  cancel: () => void;
};

const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

/** Opens the microphone and starts a MediaRecorder session. */
export async function startAudioRecording(): Promise<ActiveRecording> {
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices?.getUserMedia
  ) {
    throw new Error("Microphone recording is not supported in this browser");
  }
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Microphone recording is not supported in this browser");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
    },
  });

  const releaseStream = () => {
    stream.getTracks().forEach((track) => track.stop());
  };

  let mimeType: string | undefined;
  let recorder: MediaRecorder;
  const chunks: BlobPart[] = [];

  try {
    mimeType = PREFERRED_MIME_TYPES.find((type) =>
      MediaRecorder.isTypeSupported(type)
    );
    recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined
    );
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.start(250);
  } catch (cause) {
    releaseStream();
    throw cause;
  }

  let finished = false;

  return {
    stop: () =>
      new Promise<Blob>((resolve, reject) => {
        if (finished) {
          resolve(
            new Blob(chunks, {
              type: recorder.mimeType || mimeType || "audio/webm",
            })
          );
          return;
        }
        finished = true;

        recorder.onstop = () => {
          releaseStream();
          resolve(
            new Blob(chunks, {
              type: recorder.mimeType || mimeType || "audio/webm",
            })
          );
        };
        recorder.onerror = () => {
          releaseStream();
          reject(new Error("The microphone stopped unexpectedly"));
        };

        try {
          recorder.stop();
        } catch {
          releaseStream();
          resolve(
            new Blob(chunks, {
              type: recorder.mimeType || mimeType || "audio/webm",
            })
          );
        }
      }),
    cancel: () => {
      finished = true;
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch {
        // already stopped
      }
      releaseStream();
    },
  };
}
