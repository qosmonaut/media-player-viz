import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';

/**
 * Visualizer class - handles different visualization types
 */
class Visualizer {
    constructor(canvas, audioContext = null, onPresetChange = null) {
        this.canvas = canvas;
        this.container = canvas.parentNode;
        this.type = 'milkdrop';
        
        if (this.type !== 'milkdrop') {
            this.ctx = canvas.getContext('2d');
        } else {
            this.ctx = null;
        }

        this.colorScheme = 'classic';
        this.audioContext = audioContext;
        this.onPresetChange = onPresetChange;
        this.butterchurnVisualizer = null;
        this.butterchurnAudioNode = null;
        this.presets = butterchurnPresets.getPresets();
        this.presetKeys = Object.keys(this.presets);
        this.currentPresetIndex = Math.floor(Math.random() * this.presetKeys.length);
        this.autoRotateInterval = null;
        this.isAutoRotating = true;
        
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        // Use window dimensions for immersive mode
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Resize butterchurn if active
        if (this.butterchurnVisualizer) {
            this.butterchurnVisualizer.setRendererSize(this.width, this.height);
        }
    }

    clear() {
        if (this.ctx) {
            this.ctx.fillStyle = 'rgb(0, 0, 0)';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
        // Stop auto-rotation when clearing/stopping
        this.stopAutoRotate();
    }

    recreateCanvas() {
        const newCanvas = document.createElement('canvas');
        newCanvas.id = this.canvas.id;
        // Copy attributes
        newCanvas.setAttribute('role', this.canvas.getAttribute('role'));
        newCanvas.setAttribute('aria-label', this.canvas.getAttribute('aria-label'));
        
        newCanvas.width = this.width;
        newCanvas.height = this.height;
        
        this.container.replaceChild(newCanvas, this.canvas);
        this.canvas = newCanvas;
        
        // Reset contexts
        this.ctx = null;
        this.butterchurnVisualizer = null;
    }
    
    initButterchurn(audioContext, audioNode) {
        this.audioContext = audioContext;
        this.butterchurnAudioNode = audioNode;
        
        // Only initialize if we are currently in milkdrop mode
        if (this.type === 'milkdrop') {
            this.createButterchurnInstance();
        }
    }

    createButterchurnInstance() {
        if (this.butterchurnVisualizer) return;

        try {
            this.butterchurnVisualizer = butterchurn.createVisualizer(this.audioContext, this.canvas, {
                width: this.width,
                height: this.height
            });
            
            // Load initial preset
            this.loadPreset(this.presetKeys[this.currentPresetIndex]);

            if (this.butterchurnAudioNode) {
                this.butterchurnVisualizer.connectAudio(this.butterchurnAudioNode);
            }
            
            if (this.isAutoRotating) {
                this.startAutoRotate();
            }
        } catch (e) {
            console.error("Failed to initialize Butterchurn:", e);
        }
    }
    
    getPresets() {
        return this.presets;
    }

    setPreset(presetName) {
        if (presetName === 'auto') {
            this.isAutoRotating = true;
            this.startAutoRotate();
        } else {
            this.isAutoRotating = false;
            this.stopAutoRotate();
            this.loadPreset(presetName);
        }
    }

    loadPreset(presetName) {
        if (this.butterchurnVisualizer && this.presets[presetName]) {
            this.butterchurnVisualizer.loadPreset(this.presets[presetName], 2.0); // 2.0s transition
            
            if (this.onPresetChange) {
                this.onPresetChange(presetName);
            }
        }
    }

    startAutoRotate() {
        this.stopAutoRotate();
        this.autoRotateInterval = setInterval(() => {
            this.currentPresetIndex = Math.floor(Math.random() * this.presetKeys.length);
            const nextPreset = this.presetKeys[this.currentPresetIndex];
            this.loadPreset(nextPreset);
        }, 15000); // 15 seconds
    }

    stopAutoRotate() {
        if (this.autoRotateInterval) {
            clearInterval(this.autoRotateInterval);
            this.autoRotateInterval = null;
        }
    }
    
    setType(type) {
        const oldType = this.type;
        this.type = type;
        
        const isWebgl = type === 'milkdrop';
        const wasWebgl = oldType === 'milkdrop';

        if (isWebgl !== wasWebgl) {
            this.recreateCanvas();
            
            if (isWebgl) {
                // Switching to WebGL
                if (this.audioContext) {
                    this.createButterchurnInstance();
                }
            } else {
                // Switching to 2D
                this.stopAutoRotate();
                this.ctx = this.canvas.getContext('2d');
            }
        }
    }
    
    setColorScheme(scheme) {
        this.colorScheme = scheme;
    }
    
    getColor(index, total, intensity = 1) {
        const schemes = {
            classic: () => {
                const blue = Math.floor(100 + intensity * 155);
                return `rgb(0, ${Math.floor(intensity * 150)}, ${blue})`;
            },
            fire: () => {
                const red = Math.floor(200 + intensity * 55);
                const green = Math.floor(intensity * 100);
                return `rgb(${red}, ${green}, 0)`;
            },
            ocean: () => {
                const blue = Math.floor(150 + intensity * 105);
                const green = Math.floor(intensity * 200);
                return `rgb(0, ${green}, ${blue})`;
            },
            rainbow: () => {
                const hue = (index / total) * 360;
                const lightness = 50 + intensity * 20;
                return `hsl(${hue}, 100%, ${lightness}%)`;
            },
            neon: () => {
                const green = Math.floor(200 + intensity * 55);
                return `rgb(0, ${green}, ${Math.floor(intensity * 100)})`;
            }
        };
        
        return schemes[this.colorScheme] ? schemes[this.colorScheme]() : schemes.classic();
    }
    
    draw(dataArray, bufferLength) {
        // Handle milkdrop separately
        if (this.type === 'milkdrop') {
            if (this.butterchurnVisualizer) {
                this.butterchurnVisualizer.render();
            }
            return;
        }
        
        // Original visualizations
        switch (this.type) {
            case 'bars':
                this.drawBars(dataArray, bufferLength);
                break;
            case 'oscilloscope':
                this.drawOscilloscope(dataArray, bufferLength);
                break;
            case 'spectrum':
                this.drawSpectrum(dataArray, bufferLength);
                break;
            case 'circular':
                this.drawCircular(dataArray, bufferLength);
                break;
            default:
                this.drawBars(dataArray, bufferLength);
        }
    }
    
    drawBars(dataArray, bufferLength) {
        this.ctx.fillStyle = 'rgb(0, 0, 0)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        const barWidth = (this.width / bufferLength);
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * this.height;
            const intensity = dataArray[i] / 255;
            
            this.ctx.fillStyle = this.getColor(i, bufferLength, intensity);
            this.ctx.fillRect(x, this.height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
    }
    
    drawOscilloscope(dataArray, bufferLength) {
        this.ctx.fillStyle = 'rgb(0, 0, 0)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = this.getColor(0, 1, 1);
        this.ctx.beginPath();
        
        const sliceWidth = this.width / bufferLength;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * this.height) / 2;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        this.ctx.lineTo(this.width, this.height / 2);
        this.ctx.stroke();
        
        // Add glow effect
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = this.getColor(0, 1, 1);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }
    
    drawSpectrum(dataArray, bufferLength) {
        this.ctx.fillStyle = 'rgb(0, 0, 0)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        const barWidth = this.width / bufferLength;
        
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * this.height * 0.8;
            const intensity = dataArray[i] / 255;
            const x = i * barWidth;
            
            // Create gradient for each bar
            const gradient = this.ctx.createLinearGradient(0, this.height - barHeight, 0, this.height);
            gradient.addColorStop(0, this.getColor(i, bufferLength, 1));
            gradient.addColorStop(1, this.getColor(i, bufferLength, 0.3));
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x, this.height - barHeight, barWidth - 1, barHeight);
            
            // Add reflection
            const reflectionGradient = this.ctx.createLinearGradient(0, this.height, 0, this.height + barHeight * 0.3);
            reflectionGradient.addColorStop(0, this.getColor(i, bufferLength, intensity * 0.3));
            reflectionGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            this.ctx.fillStyle = reflectionGradient;
            this.ctx.fillRect(x, this.height, barWidth - 1, barHeight * 0.3);
        }
    }
    
    drawCircular(dataArray, bufferLength) {
        this.ctx.fillStyle = 'rgb(0, 0, 0)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius = Math.min(this.width, this.height) / 3;
        
        this.ctx.beginPath();
        
        for (let i = 0; i < bufferLength; i++) {
            const angle = (i / bufferLength) * Math.PI * 2;
            const barHeight = (dataArray[i] / 255) * radius;
            const intensity = dataArray[i] / 255;
            
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barHeight);
            const y2 = centerY + Math.sin(angle) * (radius + barHeight);
            
            this.ctx.strokeStyle = this.getColor(i, bufferLength, intensity);
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
        
        // Draw center circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 0.1, 0, Math.PI * 2);
        this.ctx.fillStyle = this.getColor(0, 1, 1);
        this.ctx.fill();
        
        // Add glow effect
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = this.getColor(0, 1, 1);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
}

export default Visualizer;
