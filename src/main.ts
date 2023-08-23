import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

const prefersSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)');

function setPreferredScheme() {
  const preferredScheme = prefersSchemeMedia.matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-bs-theme', preferredScheme);
}
setPreferredScheme();

prefersSchemeMedia.addEventListener('change', setPreferredScheme);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
