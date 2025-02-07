/* eslint-disable @typescript-eslint/no-empty-function */
import { TestBed } from '@angular/core/testing';

import { MediaDeviceService } from './media-device.service';
import { ImageMediaTrackCapabilities, ImageMediaTrackConstraintSet, ImageMediaTrackSettings } from '../models';

describe('MediaDeviceService', () => {
  let service: MediaDeviceService;

  const mockedVideoDevices: MediaDeviceInfo[] = [
    {
      deviceId: 'video1',
      groupId: 'group1',
      kind: 'videoinput',
      label: 'Front Camera',
      toJSON() {},
    },
    {
      deviceId: 'video2',
      groupId: 'group1',
      kind: 'videoinput',
      label: 'Rear Camera',
      toJSON() {},
    },
  ];
  const mockedMediaApi: { devics: MediaDeviceInfo[]; stream: MediaStream } = {
    devics: [
      ...mockedVideoDevices,
      {
        deviceId: 'audio1',
        groupId: 'group2',
        kind: 'audioinput',
        label: 'Microphone',
        toJSON() {},
      },
    ],
    stream: new MediaStream(),
  };

  beforeEach(() => {
    mockedMediaApi.stream = new MediaStream();
    Object.defineProperty(window.navigator, 'mediaDevices', {
      configurable: true,
      writable: true,
      value: {
        enumerateDevices: () => Promise.resolve(mockedMediaApi.devics),
        getUserMedia: (): Promise<MediaStream> => Promise.resolve(mockedMediaApi.stream),
      },
    });

    TestBed.configureTestingModule({
      providers: [MediaDeviceService],
    });
    service = TestBed.inject(MediaDeviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get video devices only', async () => {
    // Act
    const enumerateDevicesSpy = spyOn(window.navigator.mediaDevices, 'enumerateDevices').and.callThrough();
    const devices = await service.getVideoDevices();

    // Assert
    expect(enumerateDevicesSpy).toHaveBeenCalled();
    expect(devices).toEqual(mockedVideoDevices);
    expect(devices.some((d) => d.kind !== 'videoinput')).toBeFalse();
  });

  describe('#getVideoStream', () => {
    it('should get video stream from environment facing device', async () => {
      // Arrange
      const getUserMediaSpy = spyOn(window.navigator.mediaDevices, 'getUserMedia').and.callThrough();
      const expectedConstraints: MediaStreamConstraints = {
        video: {
          width: { min: 720 },
          height: { min: 720 },
          facingMode: 'environment',
        },
      };

      // Act
      const stream = await service.getVideoStream();

      // Assert
      expect(getUserMediaSpy).toHaveBeenCalledOnceWith(expectedConstraints);
      expect(stream).toBeTruthy();
    });

    it('should get video stream from specific device', async () => {
      // Arrange
      const getUserMediaSpy = spyOn(window.navigator.mediaDevices, 'getUserMedia').and.callThrough();
      const mockedVideoDevice = mockedVideoDevices[0];
      const expectedConstraints: MediaStreamConstraints = {
        video: {
          width: { min: 720 },
          height: { min: 720 },
          deviceId: { exact: mockedVideoDevice.deviceId },
        },
      };

      // Act
      const stream = await service.getVideoStream(mockedVideoDevice);

      // Assert
      expect(getUserMediaSpy).toHaveBeenCalledOnceWith(expectedConstraints);
      expect(stream).toBeTruthy();
    });
  });

  describe('#getDeviceFromStream', () => {
    it('should return undefined if video track not found', () => {
      // Arrange
      const stream = new MediaStream();

      // Act
      const result = service.getDeviceFromStream(stream);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return device id from video track', () => {
      // Arrange
      const deviceId = 'test-id';
      const mockedStream = {
        getVideoTracks: () => [
          {
            getSettings: () => ({ deviceId }),
          },
        ],
      } as unknown as MediaStream;

      // Act
      const result = service.getDeviceFromStream(mockedStream);

      // Assert
      expect(result).toBe(deviceId);
    });
  });

  describe('#applyAppropriateConstraints', () => {
    it('should NOT apply constrains for unsupported capabilities', async () => {
      // Arrange
      const mockedTrack = {
        // getCapabilities: () => ({ }),
        getSettings: () => ({ }),
      };
      const mockedStream = {
        getVideoTracks: () => [mockedTrack],
      } as unknown as MediaStream;
      const getSettingsSpy = spyOn(mockedTrack, 'getSettings');

      // Act
      await service.applyAppropriateConstraints(mockedStream);

      // Assert
      expect(getSettingsSpy).not.toHaveBeenCalled();
    });

    it('should proceed with applying constraints when supported', async () => {
      // Arrange
      const mockedTrack = {
        getCapabilities: () => ({ }),
        getSettings: () => ({ }),
        applyConstraints: () => Promise.resolve(undefined),
      };
      const mockedStream = {
        getVideoTracks: () => [mockedTrack],
      } as unknown as MediaStream;
      const getSettingsSpy = spyOn(mockedTrack, 'getSettings').and.returnValue({});
      const getCapabilitiesSpy = spyOn(mockedTrack, 'getCapabilities').and.returnValue({});
      const applyConstraintsSpy = spyOn(mockedTrack, 'applyConstraints').and.resolveTo(undefined);

      // Act
      await service.applyAppropriateConstraints(mockedStream);

      // Assert
      expect(getSettingsSpy).toHaveBeenCalled();
      expect(getCapabilitiesSpy).toHaveBeenCalled();
      expect(applyConstraintsSpy).toHaveBeenCalled();
    });

    it('should proceed with applying constraints when supported', async () => {
      // Arrange
      const mockedSettings: ImageMediaTrackSettings = {
        focusMode: 'manual',
        exposureMode: 'single-shot',
        whiteBalanceMode: 'manual',
        frameRate: 30,
      };
      const mockedCapabilities: ImageMediaTrackCapabilities = {
        focusMode: ['continuous', 'manual'],
        exposureMode: ['continuous', 'manual'],
        whiteBalanceMode: ['continuous', 'manual'],
        sharpness: { max: 5 },
        frameRate: { max: 60 },
      };
      const expectedConstraints: ImageMediaTrackConstraintSet = {
        focusMode: 'continuous',
        exposureMode: 'continuous',
        whiteBalanceMode: 'continuous',
        sharpness: { ideal: 4 },
        frameRate: { ideal: 60 },
      };
      const mockedTrack = {
        getCapabilities: () => ({ }),
        getSettings: () => ({ }),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        applyConstraints: (constraints: ImageMediaTrackConstraintSet) => Promise.resolve(undefined),
      };
      const mockedStream = {
        getVideoTracks: () => [mockedTrack],
      } as unknown as MediaStream;
      const getSettingsSpy = spyOn(mockedTrack, 'getSettings').and.returnValue(mockedSettings);
      const getCapabilitiesSpy = spyOn(mockedTrack, 'getCapabilities').and.returnValue(mockedCapabilities);
      const applyConstraintsSpy = spyOn(mockedTrack, 'applyConstraints').and.resolveTo(undefined);

      // Act
      await service.applyAppropriateConstraints(mockedStream);

      // Assert
      expect(getSettingsSpy).toHaveBeenCalled();
      expect(getCapabilitiesSpy).toHaveBeenCalled();
      expect(applyConstraintsSpy).toHaveBeenCalledOnceWith(expectedConstraints);
    });
  });

  describe('#removeTracksFromStream', () => {
    it('should stop and remove all tracks from stream', () => {
      // Arrange
      const mockedTrack = {
        stop: () => {},
      };
      const stopSpy = spyOn(mockedTrack, 'stop');
      const mockedStream = {
        removeTrack: () => {},
        getTracks: () => [mockedTrack],
      } as unknown as MediaStream;
      const removeTrackSpy = spyOn(mockedStream, 'removeTrack');

      // Act
      service.removeTracksFromStream(mockedStream);

      // Assert
      expect(stopSpy).toHaveBeenCalled();
      expect(removeTrackSpy).toHaveBeenCalledOnceWith(mockedTrack as MediaStreamTrack);
    });
  });
});
