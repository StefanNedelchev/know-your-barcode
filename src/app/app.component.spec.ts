import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { MockComponent } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { AppComponent } from './app.component';
import { BarcodeResultsComponent } from './components/barcode-results/barcode-results.component';

describe('AppComponent', () => {
  let swUpdateSpy: jasmine.SpyObj<SwUpdate>;
  let windowConfirmSpy: jasmine.Spy<(message?: string) => boolean>;
  const versionUpdates$ = new BehaviorSubject<VersionEvent>({ type: 'NO_NEW_VERSION_DETECTED', version: { hash: '' } });

  beforeEach(() => {
    versionUpdates$.next({ type: 'NO_NEW_VERSION_DETECTED', version: { hash: '' } });

    windowConfirmSpy = spyOn(window, 'confirm').and.returnValue(false);

    swUpdateSpy = {
      ...jasmine.createSpyObj<SwUpdate>('SwUpdate', ['isEnabled', 'versionUpdates']),
      versionUpdates: versionUpdates$.asObservable(),
      isEnabled: false,
    } as jasmine.SpyObj<SwUpdate>;

    TestBed.configureTestingModule({
      imports: [
        AppComponent,
        MockComponent(BarcodeResultsComponent),
      ],
      providers: [
        { provide: SwUpdate, useValue: swUpdateSpy },
      ],
    });
  });

  it('should create the app', () => {
    windowConfirmSpy.and.returnValue(false);
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should detect service worker update and NOT reload the page', () => {
    // Arrange
    Object.defineProperty(swUpdateSpy, 'isEnabled', {
      writable: true,
      value: true,
    });
    windowConfirmSpy.and.returnValue(false);
    versionUpdates$.next({ type: 'VERSION_DETECTED' } as VersionEvent);
    const fixture = TestBed.createComponent(AppComponent);

    // Act
    fixture.detectChanges();

    // Assert
    expect(windowConfirmSpy).not.toHaveBeenCalled();

    // Act
    versionUpdates$.next({ type: 'VERSION_READY' } as VersionEvent);
    fixture.detectChanges();

    // Assert
    expect(windowConfirmSpy).toHaveBeenCalled();
  });

  it('should detect service worker update and NOT reload the page', () => {
    // Arrange
    let isReloaded = false;
    Object.defineProperty(swUpdateSpy, 'isEnabled', {
      writable: true,
      value: true,
    });
    windowConfirmSpy.and.returnValue(true);
    const fixture = TestBed.createComponent(AppComponent);
    Object.defineProperty(fixture.componentInstance, 'reloadPage', {
      writable: true,
      value: () => { isReloaded = true },
    });

    // Act
    versionUpdates$.next({ type: 'VERSION_READY' } as VersionEvent);
    fixture.detectChanges();

    // Assert
    expect(windowConfirmSpy).toHaveBeenCalled();
    expect(isReloaded).toBeTrue();
  });
});
