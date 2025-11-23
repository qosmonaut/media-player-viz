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
let audioSourceType = 'microphone'; // 'microphone' or 'file'
let audioElement = null;
let fileSource = null;

// DOM elements
const audioFileInput = document.getElementById('audioFileInput');
const uploadBtn = document.getElementById('uploadBtn');
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
const iconFullscreen = fullscreenBtn.querySelector('.icon-fullscreen');
const iconWindow = fullscreenBtn.querySelector('.icon-window');
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
    option.text = key.length > 50 ? key.substring(0, 50) + '...' : key;
    presetSelect.appendChild(option);
});

// Event listeners
uploadBtn.addEventListener('click', () => audioFileInput.click());
audioFileInput.addEventListener('change', handleFileUpload);
playPauseBtn.addEventListener('click', toggleVisualization);
fullscreenBtn.addEventListener('click', toggleFullscreen);

// Handle select menu arrow rotation and focus states
document.querySelectorAll('select').forEach(select => {
    select.addEventListener('change', () => {
        select.blur();
        select.classList.remove('menu-open');
    });
    
    select.addEventListener('blur', () => {
        select.classList.remove('menu-open');
    });
    
    select.addEventListener('click', () => {
        select.classList.toggle('menu-open');
    });
});

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
 * Handle file upload
 */
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Stop current visualization
    if (isRunning) {
        stopVisualization();
    }

    // Clean up previous audio element if exists
    if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
        audioElement = null;
    }

    audioSourceType = 'file';
    audioElement = new Audio(URL.createObjectURL(file));
    audioElement.loop = true; // Loop the song
    
    showStatus(`Loaded: ${file.name}`);
    
    // Start visualization with new file
    startVisualization();
}

/**
 * Toggle visualization state
 */
function toggleVisualization() {
    if (isRunning) {
        if (audioSourceType === 'file' && audioElement) {
            audioElement.pause();
            isRunning = false;
            iconPlay.style.display = 'inline';
            iconStop.style.display = 'none';
            playPauseBtn.setAttribute('data-tooltip', 'Resume Visualization');
            showStatus('Paused');
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        } else {
            stopVisualization();
        }
    } else {
        startVisualization();
    }
}

/**
 * Start the visualization
 */
async function startVisualization() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
        }

        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        if (audioSourceType === 'microphone') {
            if (!mediaStream) {
                showStatus('Requesting microphone access...');
                mediaStream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    } 
                });
                microphone = audioContext.createMediaStreamSource(mediaStream);
                microphone.connect(analyser);
            }
            visualizer.initButterchurn(audioContext, microphone);
            showStatus('Microphone Active');
        } else if (audioSourceType === 'file') {
            if (!audioElement) {
                showStatus('No file loaded');
                return;
            }
            
            if (!fileSource) {
                fileSource = audioContext.createMediaElementSource(audioElement);
                fileSource.connect(analyser);
                analyser.connect(audioContext.destination); // Connect to speakers
            }
            
            visualizer.initButterchurn(audioContext, fileSource);
            await audioElement.play();
            showStatus('Playing Audio');
        }
        
        // Update UI
        isRunning = true;
        iconPlay.style.display = 'none';
        iconStop.style.display = 'inline';
        playPauseBtn.setAttribute('data-tooltip', 'Stop Visualization');
        
        // Start animation loop
        if (!animationId) {
            animate();
        }
        
    } catch (error) {
        console.error('Error starting visualization:', error);
        showStatus(`Error: ${error.message}`);
        stopVisualization();
    }
}

/**
 * Stop the visualization
 */
function stopVisualization() {
    isRunning = false;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    if (audioSourceType === 'microphone') {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        if (microphone) {
            microphone.disconnect();
            microphone = null;
        }
    } else if (audioSourceType === 'file') {
        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
        }
    }
    
    // We don't close audioContext anymore to allow reuse, just suspend if needed or leave open
    // But to be safe and reset state completely for mic:
    if (audioSourceType === 'microphone' && audioContext) {
        audioContext.close();
        audioContext = null;
        analyser = null;
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
        iconFullscreen.style.display = 'inline';
        iconWindow.style.display = 'none';
        fullscreenBtn.setAttribute('data-tooltip', 'Enter Fullscreen');
    } else {
        iconFullscreen.style.display = 'none';
        iconWindow.style.display = 'inline';
        fullscreenBtn.setAttribute('data-tooltip', 'Exit Fullscreen');
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

