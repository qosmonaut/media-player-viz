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
const fullscreenBtn = document.getElementById('fullscreenBtn');
const exitFullscreenBtn = document.getElementById('exitFullscreenBtn');
const vizTypeSelect = document.getElementById('vizType');
const colorSchemeSelect = document.getElementById('colorScheme');
const statusDiv = document.getElementById('status');
const canvas = document.getElementById('visualizer');
const visualizerContainer = document.getElementById('visualizerContainer');

// Initialize visualizer
visualizer = new Visualizer(canvas);

// Event listeners
startBtn.addEventListener('click', startVisualization);
stopBtn.addEventListener('click', stopVisualization);
fullscreenBtn.addEventListener('click', toggleFullscreen);
exitFullscreenBtn.addEventListener('click', exitFullscreen);
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
        updateStatus('Checking microphone permissions...');
        
        // Check current permission status
        let permissionStatus;
        try {
            permissionStatus = await navigator.permissions.query({ name: 'microphone' });
        } catch (permError) {
            // Permissions API might not be supported in some browsers, continue anyway
            console.warn('Permissions API not supported, proceeding with getUserMedia');
        }
        
        // If permission was previously denied, show helpful message
        if (permissionStatus && permissionStatus.state === 'denied') {
            updateStatus('❌ Microphone access was denied. Please click the lock/permissions icon in your browser\'s address bar and allow microphone access, then try again.');
            startBtn.disabled = false;
            stopBtn.disabled = true;
            return;
        }
        
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
        
        // Provide more helpful error messages based on error type
        let errorMessage = '❌ Error: Could not access microphone. ';
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMessage += 'Permission was denied. Please click the lock/permissions icon in your browser\'s address bar and allow microphone access, then try again.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            errorMessage += 'No microphone found. Please connect a microphone and try again.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            errorMessage += 'Microphone is already in use by another application. Please close other apps using the microphone and try again.';
        } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
            errorMessage += 'Could not find a microphone matching the requested settings.';
        } else if (error.name === 'SecurityError') {
            errorMessage += 'Microphone access is not allowed on this page. Make sure you\'re using HTTPS or localhost.';
        } else {
            errorMessage += 'Please check your browser settings and try again.';
        }
        
        updateStatus(errorMessage);
        
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
 * Toggle fullscreen mode
 */
function toggleFullscreen() {
    if (!document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && 
        !document.msFullscreenElement) {
        enterFullscreen();
    } else {
        exitFullscreen();
    }
}

/**
 * Enter fullscreen mode
 */
function enterFullscreen() {
    const element = visualizerContainer;
    
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

/**
 * Exit fullscreen mode
 */
function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

/**
 * Handle fullscreen state changes
 */
function handleFullscreenChange() {
    const isFullscreen = !!(document.fullscreenElement || 
                            document.webkitFullscreenElement || 
                            document.mozFullScreenElement || 
                            document.msFullscreenElement);
    
    if (isFullscreen) {
        fullscreenBtn.textContent = '⛶ Exit Fullscreen';
        exitFullscreenBtn.style.display = 'block';
        // Trigger canvas resize for fullscreen
        visualizer.resizeCanvas();
    } else {
        fullscreenBtn.textContent = '⛶ Fullscreen';
        exitFullscreenBtn.style.display = 'none';
        // Trigger canvas resize for normal mode
        visualizer.resizeCanvas();
    }
}

// Listen for fullscreen changes
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

// ESC key listener is built-in to the Fullscreen API
// It automatically exits fullscreen when ESC is pressed

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
