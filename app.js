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

// DOM elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const vizTypeSelect = document.getElementById('vizType');
const colorSchemeSelect = document.getElementById('colorScheme');
const statusDiv = document.getElementById('status');
const canvas = document.getElementById('visualizer');

// Initialize visualizer
visualizer = new Visualizer(canvas);

// Event listeners
startBtn.addEventListener('click', startVisualization);
stopBtn.addEventListener('click', stopVisualization);
vizTypeSelect.addEventListener('change', (e) => {
    visualizer.setType(e.target.value);
    updateStatus(`Visualization changed to: ${e.target.options[e.target.selectedIndex].text}`);
});
colorSchemeSelect.addEventListener('change', (e) => {
    visualizer.setColorScheme(e.target.value);
    updateStatus(`Color scheme changed to: ${e.target.options[e.target.selectedIndex].text}`);
});

/**
 * Start the visualization by requesting microphone access
 */
async function startVisualization() {
    try {
        updateStatus('Requesting microphone access...');
        
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
        
        // Update UI
        startBtn.disabled = true;
        stopBtn.disabled = false;
        updateStatus('🎤 Microphone active - Visualization running');
        
        // Start animation loop
        animate();
        
    } catch (error) {
        console.error('Error accessing microphone:', error);
        updateStatus('❌ Error: Could not access microphone. Please grant permission and try again.');
        
        // Reset buttons
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
}

/**
 * Stop the visualization and release microphone
 */
function stopVisualization() {
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
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update UI
    startBtn.disabled = false;
    stopBtn.disabled = true;
    updateStatus('Visualization stopped');
}

/**
 * Animation loop for continuous visualization
 */
function animate() {
    animationId = requestAnimationFrame(animate);
    
    // Get frequency data
    analyser.getByteFrequencyData(dataArray);
    
    // Draw visualization
    visualizer.draw(dataArray, bufferLength);
}

/**
 * Update status message
 */
function updateStatus(message) {
    statusDiv.textContent = message;
}

/**
 * Handle page visibility changes to save resources
 */
document.addEventListener('visibilitychange', () => {
    if (document.hidden && animationId) {
        // Page is hidden, pause animation but keep microphone active
        cancelAnimationFrame(animationId);
        animationId = null;
    } else if (!document.hidden && audioContext && !animationId) {
        // Page is visible again, resume animation
        animate();
    }
});

/**
 * Clean up on page unload
 */
window.addEventListener('beforeunload', () => {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    if (audioContext) {
        audioContext.close();
    }
});

// Initial status message
updateStatus('Click "Start Microphone" to begin');
