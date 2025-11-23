import Visualizer from './visualizer.js';

/**
 * Main application file - handles microphone input and audio analysis
 */

let audioContext;
let analyser;
let microphone;
let mediaStream;
let dataArray;
let bufferLength;
let animationId;
let visualizer;
let isRunning = false;

// DOM elements
const playPauseBtn = document.getElementById('playPauseBtn');
const iconPlay = playPauseBtn.querySelector('.icon-play');
const iconStop = playPauseBtn.querySelector('.icon-stop');
const vizTypeSelect = document.getElementById('vizType');
const colorSchemeSelect = document.getElementById('colorScheme');
const presetSelect = document.getElementById('presetSelect');
const colorControl = document.getElementById('colorControl');
const presetControl = document.getElementById('presetControl');
const statusDiv = document.getElementById('status');
const canvas = document.getElementById('visualizer');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const fullscreenHint = document.getElementById('fullscreenHint');

// Initialize visualizer
visualizer = new Visualizer(canvas, null, (presetName) => {
    // Flash preset name when auto-rotating
    if (visualizer.isAutoRotating) {
        const shortName = presetName.length > 50 ? presetName.substring(0, 50) + '...' : presetName;
        showStatus(shortName);
    }
});

// Ensure initial state is Milkdrop
vizTypeSelect.value = 'milkdrop';
visualizer.setType('milkdrop');
colorControl.style.display = 'none';
presetControl.style.display = 'flex';

// Populate presets
const presets = visualizer.getPresets();
Object.keys(presets).forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.text = key;
    presetSelect.appendChild(option);
});

// Event listeners
playPauseBtn.addEventListener('click', toggleVisualization);
fullscreenBtn.addEventListener('click', toggleFullscreen);

vizTypeSelect.addEventListener('change', (e) => {
    const type = e.target.value;
    visualizer.setType(type);
    
    // Toggle controls based on type
    if (type === 'milkdrop') {
        colorControl.style.display = 'none';
        presetControl.style.display = 'flex';
    } else {
        colorControl.style.display = 'flex';
        presetControl.style.display = 'none';
    }
    
    showStatus(`Visualization: ${e.target.options[e.target.selectedIndex].text}`);
});

colorSchemeSelect.addEventListener('change', (e) => {
    visualizer.setColorScheme(e.target.value);
    showStatus(`Color: ${e.target.options[e.target.selectedIndex].text}`);
});

presetSelect.addEventListener('change', (e) => {
    visualizer.setPreset(e.target.value);
    if (e.target.value === 'auto') {
        showStatus('Auto-rotating presets (15s)');
    } else {
        showStatus(`Preset: ${e.target.value}`);
    }
});

/**
 * Toggle visualization state
 */
function toggleVisualization() {
    if (isRunning) {
        stopVisualization();
    } else {
        startVisualization();
    }
}

/**
 * Start the visualization by requesting microphone access
 */
async function startVisualization() {
    try {
        showStatus('Requesting microphone access...');
        
        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        // Request microphone access
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            } 
        });
        
        microphone = audioContext.createMediaStreamSource(mediaStream);
        microphone.connect(analyser);
        
        // Initialize butterchurn with audio context and audio node
        visualizer.initButterchurn(audioContext, microphone);
        
        // Update UI
        isRunning = true;
        iconPlay.style.display = 'none';
        iconStop.style.display = 'inline';
        playPauseBtn.setAttribute('data-tooltip', 'Stop Visualization');
        
        // Start animation loop
        animate();
        
    } catch (error) {
        console.error('Error accessing microphone:', error);
        showStatus('Error: Could not access microphone');
        stopVisualization();
    }
}

/**
 * Stop the visualization and release microphone
 */
function stopVisualization() {
    isRunning = false;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    
    // Clear canvas
    visualizer.clear();
    
    // Update UI
    iconPlay.style.display = 'inline';
    iconStop.style.display = 'none';
    playPauseBtn.setAttribute('data-tooltip', 'Start Visualization');
    showStatus('Stopped');
}

/**
 * Animation loop for continuous visualization
 */
function animate() {
    if (!isRunning) return;
    
    animationId = requestAnimationFrame(animate);
    
    // Get frequency data
    analyser.getByteFrequencyData(dataArray);
    
    // Draw visualization
    visualizer.draw(dataArray, bufferLength);
}

let statusTimeout;
/**
 * Update status message with auto-hide
 */
function showStatus(message) {
    statusDiv.textContent = message;
    statusDiv.classList.remove('hidden');
    
    if (statusTimeout) clearTimeout(statusTimeout);
    
    statusTimeout = setTimeout(() => {
        statusDiv.classList.add('hidden');
    }, 3000);
}

/**
 * Toggle fullscreen mode
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
        fullscreenHint.classList.add('visible');
        setTimeout(() => {
            fullscreenHint.classList.remove('visible');
        }, 3000);
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Listen for fullscreen changes to update UI if needed (e.g. ESC key)
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        fullscreenHint.classList.remove('visible');
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isRunning) {
        cancelAnimationFrame(animationId);
        animationId = null;
    } else if (!document.hidden && isRunning && !animationId) {
        animate();
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    stopVisualization();
});

