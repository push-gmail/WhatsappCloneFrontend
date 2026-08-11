package com.whatsappclone.callaudioroute;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.List;

@CapacitorPlugin(name = "CallAudioRoute")
public class CallAudioRoutePlugin extends Plugin {

    private AudioManager audioManager;
    private int previousAudioMode = AudioManager.MODE_NORMAL;
    private boolean callModeActive = false;

    @Override
    public void load() {
        super.load();
        audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
    }

    @PluginMethod
    public void startCall(PluginCall call) {
        if (audioManager == null) {
            call.reject("AudioManager is unavailable");
            return;
        }

        boolean speaker = call.getBoolean("speaker", false);

        try {
            if (!callModeActive) {
                previousAudioMode = audioManager.getMode();
            }

            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            callModeActive = true;

            boolean applied = applySpeakerMode(speaker);

            JSObject result = new JSObject();
            result.put("speaker", speaker && applied);
            call.resolve(result);
        } catch (Exception exception) {
            call.reject("Could not start Android communication audio mode", exception);
        }
    }

    @PluginMethod
    public void setSpeaker(PluginCall call) {
        if (audioManager == null) {
            call.reject("AudioManager is unavailable");
            return;
        }

        boolean enabled = call.getBoolean("enabled", false);

        try {
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            callModeActive = true;

            boolean applied = applySpeakerMode(enabled);

            JSObject result = new JSObject();
            result.put("speaker", enabled && applied);
            call.resolve(result);
        } catch (Exception exception) {
            call.reject("Could not change Android call audio output", exception);
        }
    }

    @PluginMethod
    public void endCall(PluginCall call) {
        try {
            restoreAudioMode();
            call.resolve();
        } catch (Exception exception) {
            call.reject("Could not restore Android audio mode", exception);
        }
    }

    @PluginMethod
    public void saveRecording(PluginCall call) {
        String base64 = call.getString("base64", "");
        String fileName = call.getString("fileName", "whatsapp-call.webm");
        String mimeType = call.getString("mimeType", "audio/webm");

        if (base64 == null || base64.trim().isEmpty()) {
            call.reject("Recording data is empty");
            return;
        }

        try {
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            JSObject result = saveRecordingBytes(bytes, fileName, mimeType);
            call.resolve(result);
        } catch (Exception exception) {
            call.reject("Could not save call recording", exception);
        }
    }

    private boolean applySpeakerMode(boolean speakerEnabled) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (speakerEnabled) {
                AudioDeviceInfo speaker = findCommunicationDevice(AudioDeviceInfo.TYPE_BUILTIN_SPEAKER);
                return speaker != null && audioManager.setCommunicationDevice(speaker);
            }

            AudioDeviceInfo earpiece = findCommunicationDevice(AudioDeviceInfo.TYPE_BUILTIN_EARPIECE);

            if (earpiece != null) {
                return audioManager.setCommunicationDevice(earpiece);
            }

            audioManager.clearCommunicationDevice();
            return true;
        }

        @SuppressWarnings("deprecation")
        boolean ignored = setLegacySpeakerphone(speakerEnabled);
        return ignored;
    }

    @SuppressWarnings("deprecation")
    private boolean setLegacySpeakerphone(boolean enabled) {
        audioManager.setSpeakerphoneOn(enabled);
        return audioManager.isSpeakerphoneOn() == enabled;
    }

    private AudioDeviceInfo findCommunicationDevice(int type) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            return null;
        }

        List<AudioDeviceInfo> devices = audioManager.getAvailableCommunicationDevices();

        for (AudioDeviceInfo device : devices) {
            if (device.getType() == type) {
                return device;
            }
        }

        return null;
    }

    private void restoreAudioMode() {
        if (audioManager == null) {
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            audioManager.clearCommunicationDevice();
        } else {
            setLegacySpeakerphone(false);
        }

        if (callModeActive) {
            audioManager.setMode(previousAudioMode);
        }

        callModeActive = false;
    }

    private JSObject saveRecordingBytes(byte[] bytes, String fileName, String mimeType) throws Exception {
        JSObject result = new JSObject();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentResolver resolver = getContext().getContentResolver();
            ContentValues values = new ContentValues();
            values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
            values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
            values.put(
                MediaStore.MediaColumns.RELATIVE_PATH,
                Environment.DIRECTORY_MUSIC + File.separator + "WhatsAppClone"
            );
            values.put(MediaStore.MediaColumns.IS_PENDING, 1);

            Uri collection = MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
            Uri itemUri = resolver.insert(collection, values);

            if (itemUri == null) {
                throw new IllegalStateException("Android MediaStore could not create the recording file");
            }

            try (OutputStream output = resolver.openOutputStream(itemUri)) {
                if (output == null) {
                    throw new IllegalStateException("Android could not open the recording file");
                }
                output.write(bytes);
                output.flush();
            }

            ContentValues complete = new ContentValues();
            complete.put(MediaStore.MediaColumns.IS_PENDING, 0);
            resolver.update(itemUri, complete, null, null);

            result.put("uri", itemUri.toString());
            result.put("path", "Music/WhatsAppClone/" + fileName);
            return result;
        }

        File baseDirectory = getContext().getExternalFilesDir(Environment.DIRECTORY_MUSIC);

        if (baseDirectory == null) {
            baseDirectory = getContext().getFilesDir();
        }

        File recordingsDirectory = new File(baseDirectory, "WhatsAppClone");

        if (!recordingsDirectory.exists() && !recordingsDirectory.mkdirs()) {
            throw new IllegalStateException("Could not create recording directory");
        }

        File recordingFile = new File(recordingsDirectory, fileName);

        try (FileOutputStream output = new FileOutputStream(recordingFile)) {
            output.write(bytes);
            output.flush();
        }

        result.put("path", recordingFile.getAbsolutePath());
        result.put("uri", Uri.fromFile(recordingFile).toString());
        return result;
    }

    @Override
    protected void handleOnDestroy() {
        restoreAudioMode();
        super.handleOnDestroy();
    }
}
