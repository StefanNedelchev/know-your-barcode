# Know Your Barcode

## Purpose of the project

The main purpose of the project is to demonstrate how it's possible to make a fully working visual barcode scanner which is also a web app but also installable as a native app with the help of some modern browser APIs.

## Technologies

### Angular

This is a web-based project built with [Angular](https://angular.dev/) using some of its latest features like standalone components, [signals](https://angular.dev/guide/signals), [control flow](https://angular.dev/guide/templates/control-flow) and ligthning fast builds with [esbuild](https://esbuild.github.io/) (which is currently the default bundler for Angular).

### PWA 📱

The project is also a Progressive Web App (PWA) thanks to the Angular thanks to its [service worker](https://angular.dev/ecosystem/service-workers). It covers all requirements for the web manifest configuration and meta tags for a "full green check" on Google's Lighthouse PWA analysis.

### Camera usage 📷

For camera streaming and capture I use the [media devices interface](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices) from the [Web RTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API). The app also detects all video devices (in some phones it could detect all of the rear cameras) and provides a select menu that allows the users to switch between different sources.

### Barcode detection

For barcode detection I use the  [Barcode Detection API](https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API). This API works like a charm but unfortunately there's still a [big gap in the browser support](https://caniuse.com/mdn-api_barcodedetector). To fill this gap I've implemented a [Barcode Detection API polyfill](https://www.npmjs.com/package/barcode-detector-api-polyfill) which is also published as an NPM package.

### Drawing via canvas ✏️

Not a new thing at all, but essential for the app, is the usage of a canvas for drawing. The app renders a transparent canvas element on top of the video stream. The canvas is used to draw the outline of all detected barcodes from the video frames. The barode detection and drawing happens in a specific time interval which is also configurable.

## Backend 🔍

The project also includes a simple [Netlify function](https://docs.netlify.com/functions/overview/) which is used for product search from detected barcodes. The function uses [Axios](https://axios-http.com/) and [Cheerio](https://cheerio.js.org/) to scrape information from [barcode.bg](https://barcode.bg/) - a Bulgarian website with huge database of barcodes with a free access (but obviously without an API 😂).

## Requirements ✅

Since the project uses Angular 17, you need to meet its minimum requirement for NodeJS which is v18.13.0

## CLI scripts

### Development server ⌨️

Run `ng serve` for a dev server powered by [Vite](https://vitejs.dev/). Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### Build 🏗️

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

### Running unit tests 🧪

Run `npm run test` to execute the unit tests via [Karma](https://karma-runner.github.io) in a headless browser.

### Running code linting 🔎

Run `ng lint` or `npm run lint` to execute code linting via [Angular ESLint](https://github.com/angular-eslint/angular-eslint). Run the same command with `--fix` argument to automatically fix some of the errors.

### Running stylesheet linting 🔎

Run `npm run stylelint` to execute stylesheet linting via [StyleLint](https://stylelint.io/). Run the same command with `--fix` argument to automatically fix some of the errors.

### Further help ❔

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
