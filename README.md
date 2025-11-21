# RetroViz

Old school Winamp / Windows Media Player visualizations as a webapp using browser microphone input.

## Features

- **Real-time audio visualization** from your microphone
- **Multiple visualization types:**
  - Bars - Classic frequency bars
  - Oscilloscope - Waveform display
  - Spectrum - Frequency spectrum with reflections
  - Circular - Radial frequency display
  - Milkdrop - Classic Winamp Milkdrop visualizer powered by butterchurn
- **Multiple color schemes:**
  - Classic Blue
  - Fire
  - Ocean
  - Rainbow
  - Neon Green
- **Responsive design** that works on desktop and mobile
- **Pure vanilla JavaScript** - no frameworks required

## Usage

1. Open the webpage in a modern browser
2. Click "Start Microphone" button
3. Grant microphone permissions when prompted
4. Select your preferred visualization type and color scheme
5. Make some noise and watch the visualization respond!

## Local Development

This project uses npm for dependency management and webpack for bundling.

### Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Or watch for changes during development
npm run watch
```

### Running Locally

Simply open `index.html` in a web browser. For best results, use a local web server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (with http-server)
npx http-server
```

Then navigate to `http://localhost:8000`

## GitHub Pages Deployment

This project is designed to be hosted on GitHub Pages:

1. Go to your repository settings
2. Navigate to "Pages" section
3. Select the branch you want to deploy (e.g., `main`)
4. Select the root directory as the source
5. Save and wait for deployment

Your visualization will be available at: `https://<username>.github.io/<repository-name>/`

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Supported (with user interaction required)

**Note:** Microphone access requires HTTPS (or localhost for development).

## Technologies Used

- **Web Audio API** - For audio input and frequency analysis
- **Canvas API** - For rendering visualizations
- **MediaDevices API** - For microphone access
- **[butterchurn](https://github.com/jberg/butterchurn)** - WebGL implementation of the Milkdrop visualizer
- **[butterchurn-presets](https://github.com/jberg/butterchurn-presets)** - Preset collection for butterchurn
- **Webpack** - Module bundler for JavaScript
- Pure HTML5, CSS3, and JavaScript (ES6+)

## Attribution

This project uses [butterchurn](https://github.com/jberg/butterchurn), a WebGL implementation of the legendary Winamp / Milkdrop visualization engine. Milkdrop was originally created by Ryan Geiss and has been a beloved music visualization tool since the early 2000s. The butterchurn project brings this classic experience to modern web browsers.

- **Milkdrop** - Original visualization engine by Ryan Geiss
- **butterchurn** - WebGL port by @jberg (Jordan Berg)

## Privacy

All audio processing happens locally in your browser. No audio data is sent to any server.

## License

MIT License - feel free to use and modify as you wish!
