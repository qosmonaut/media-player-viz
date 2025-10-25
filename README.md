# Media Player Visualizer 🎵

Old school Windows Media Player visualizations as a webapp using browser microphone input.

## Features

- **Real-time audio visualization** from your microphone
- **Multiple visualization types:**
  - Bars - Classic frequency bars
  - Oscilloscope - Waveform display
  - Spectrum - Frequency spectrum with reflections
  - Circular - Radial frequency display
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
- Pure HTML5, CSS3, and JavaScript (ES6+)

## Privacy

All audio processing happens locally in your browser. No audio data is sent to any server.

## License

MIT License - feel free to use and modify as you wish!
