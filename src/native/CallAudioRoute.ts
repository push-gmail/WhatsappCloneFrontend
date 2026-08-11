import {
  Capacitor,
  registerPlugin,
} from "@capacitor/core";

type SaveRecordingOptions = {
  base64: string;
  fileName: string;
  mimeType?: string;
};

type SaveRecordingResult = {
  path?: string;
  uri?: string;
};

type CallAudioRoutePlugin = {
  startCall(options: {
    speaker: boolean;
  }): Promise<{ speaker: boolean }>;
  setSpeaker(options: {
    enabled: boolean;
  }): Promise<{ speaker: boolean }>;
  endCall(): Promise<void>;
  saveRecording(
    options: SaveRecordingOptions
  ): Promise<SaveRecordingResult>;
};

const NativeCallAudioRoute =
  registerPlugin<CallAudioRoutePlugin>(
    "CallAudioRoute"
  );

export const isNativeAndroidCallAudio = () =>
  Capacitor.isNativePlatform() &&
  Capacitor.getPlatform() === "android";

export const startNativeAudioCall = async (
  speaker = false
) => {
  if (!isNativeAndroidCallAudio()) {
    return { speaker: false };
  }

  return NativeCallAudioRoute.startCall({
    speaker,
  });
};

export const setNativeCallSpeaker = async (
  enabled: boolean
) => {
  if (!isNativeAndroidCallAudio()) {
    return { speaker: false };
  }

  return NativeCallAudioRoute.setSpeaker({
    enabled,
  });
};

export const endNativeAudioCall = async () => {
  if (!isNativeAndroidCallAudio()) {
    return;
  }

  await NativeCallAudioRoute.endCall();
};

export const saveNativeCallRecording = async (
  options: SaveRecordingOptions
) => {
  if (!isNativeAndroidCallAudio()) {
    return {} as SaveRecordingResult;
  }

  return NativeCallAudioRoute.saveRecording(
    options
  );
};