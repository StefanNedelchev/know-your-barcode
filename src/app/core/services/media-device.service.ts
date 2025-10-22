import { Injectable } from '@angular/core';
import { ImageMediaTrackCapabilities, ImageMediaTrackConstraintSet, ImageMediaTrackSettings } from '../models';

@Injectable({
  providedIn: 'root',
})
export class MediaDeviceService {
  private readonly DEFAULT_SIZE = 720;

  public async getVideoDevices(): Promise<MediaDeviceInfo[]> {
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    return allDevices.filter(({ kind }) => kind === 'videoinput');
  }

  public getVideoStream(device?: MediaDeviceInfo): Promise<MediaStream> {
    const constraints: MediaTrackConstraints = {
      width: { min: this.DEFAULT_SIZE },
      height: { min: this.DEFAULT_SIZE },
    };

    if (device?.kind === 'videoinput') {
      constraints.deviceId = { exact: device.deviceId };
    } else {
      constraints.facingMode = 'environment';
    }

    return navigator.mediaDevices.getUserMedia({ video: constraints });
  }

  public getDeviceFromStream(stream: MediaStream): string | undefined {
    return stream.getVideoTracks()[0]?.getSettings()?.deviceId;
  }

  public async applyAppropriateConstraints(stream: MediaStream): Promise<void> {
    const videoTrack = stream.getVideoTracks()[0] as MediaStreamTrack | undefined;

    if (!videoTrack || !('getCapabilities' in videoTrack)) {
      return;
    }

    const capabilities = videoTrack.getCapabilities() as ImageMediaTrackCapabilities;
    const settings = videoTrack.getSettings() as ImageMediaTrackSettings;
    const newConstraints: ImageMediaTrackConstraintSet = {};

    if (capabilities.focusMode?.includes('continuous') && settings.focusMode !== 'continuous') {
      newConstraints.focusMode = 'continuous';
    }

    if (capabilities.exposureMode?.includes('continuous') && settings.exposureMode !== 'continuous') {
      newConstraints.exposureMode = 'continuous';
    }

    if (capabilities.whiteBalanceMode?.includes('continuous') && settings.whiteBalanceMode !== 'continuous') {
      newConstraints.whiteBalanceMode = 'continuous';
    }

    if (capabilities.sharpness?.max) {
      newConstraints.sharpness = { ideal: capabilities.sharpness.max - 1 };
    }

    if (
      capabilities.frameRate?.max
      && settings.frameRate
      && settings.frameRate < capabilities.frameRate.max
    ) {
      newConstraints.frameRate = { ideal: capabilities.frameRate.max };
    }

    await videoTrack.applyConstraints(newConstraints);
  }

  public removeTracksFromStream(stream: MediaStream): void {
    stream.getTracks().forEach((t) => {
      t.stop();
      stream.removeTrack(t);
    });
  }
}
