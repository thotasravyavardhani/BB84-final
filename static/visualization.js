// BB84 QKD Quantum Channel Visualization
// Crystal-clear, professional visualization for quantum key distribution protocol

class QuantumChannelVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn('Canvas not found:', canvasId);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.warn('Canvas context not available');
            return;
        }
        this.data = null;
        this.animationId = null;
        this.currentFrame = 0;
        this.totalFrames = 100;
        this.isPlaying = false;
        this.speed = 1;
        
        // Adaptive visualization settings
        this.settings = {
            baseQubitSize: 12,
            channelHeight: 80,
            channelY: 120,
            aliceY: 60,
            bobY: 200,
            eveY: 140,
            baseSpacing: 60,
            maxQubitsPerRow: 16,  // Maximum qubits before wrapping to new row
            minQubitSize: 6,      // Minimum size for readability
            compactThreshold: 16, // When to switch to compact mode
            colors: {
                alice: '#3b82f6',      // Blue
                bob: '#22c55e',        // Green
                eve: '#ef4444',        // Red
                intercepted: '#f59e0b', // Amber
                channel: '#e5e7eb',    // Gray
                background: '#f8fafc'   // Light gray
            },
            bases: {
                '+': { symbol: '|', color: '#6366f1' },  // Rectilinear - Purple
                'x': { symbol: '⟋', color: '#ec4899' }   // Diagonal - Pink
            }
        };
        
        this.setupCanvas();
        this.bindControls();
    }

    setupCanvas() {
        // Set up high-DPI canvas with adaptive height
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Calculate required height based on expected qubit count
        const expectedQubits = this.data ? this.data.alice_bits?.length || 4 : 4;
        const requiredHeight = this.calculateCanvasHeight(expectedQubits);
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = requiredHeight * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = requiredHeight + 'px';
        
        // Set font and line styles
        this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Add quantum field background
        this.setupQuantumBackground();
    }
    
    setupQuantumBackground() {
        // Create animated quantum field background
        const rect = this.canvas.getBoundingClientRect();
        this.quantumParticles = [];
        
        for (let i = 0; i < 15; i++) {
            this.quantumParticles.push({
                x: Math.random() * rect.width,
                y: Math.random() * rect.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.3 + 0.1
            });
        }
    }
    
    calculateCanvasHeight(numQubits) {
        if (numQubits <= 8) return 300;
        if (numQubits <= 16) return 350;
        if (numQubits <= 24) return 400;
        return Math.min(500, 300 + Math.ceil(numQubits / this.settings.maxQubitsPerRow) * 80);
    }
    
    calculateLayoutParameters(numQubits, canvasWidth) {
        const layout = {
            qubitSize: this.settings.baseQubitSize,
            spacing: this.settings.baseSpacing,
            rows: 1,
            qubitsPerRow: numQubits,
            isCompact: numQubits > this.settings.compactThreshold
        };
        
        if (numQubits > this.settings.maxQubitsPerRow) {
            layout.rows = Math.ceil(numQubits / this.settings.maxQubitsPerRow);
            layout.qubitsPerRow = Math.ceil(numQubits / layout.rows);
        }
        
        // Calculate optimal spacing and size
        const availableWidth = canvasWidth - 200; // Reserve space for participants
        const requiredSpacing = availableWidth / layout.qubitsPerRow;
        
        if (requiredSpacing < this.settings.baseSpacing) {
            layout.spacing = Math.max(30, requiredSpacing);
            layout.qubitSize = Math.max(this.settings.minQubitSize, layout.spacing * 0.25);
        }
        
        return layout;
    }

    bindControls() {
        // Bind to existing animation controls
        const playBtn = document.getElementById('playAnimation');
        const pauseBtn = document.getElementById('pauseAnimation');
        const resetBtn = document.getElementById('resetAnimation');
        const scrubber = document.getElementById('animationScrubber');

        if (playBtn) playBtn.addEventListener('click', () => this.play());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pause());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (scrubber) {
            scrubber.addEventListener('input', (e) => {
                this.scrubTo(parseInt(e.target.value));
            });
        }
    }

    setData(simulationData) {
        this.data = simulationData;
        this.totalFrames = Math.max(100, (simulationData.alice_bits?.length || 4) * 20);
        this.reset();
        this.render();
    }

    play() {
        if (!this.data || this.isPlaying) return;
        
        this.isPlaying = true;
        this.animate();
        
        // Update UI
        document.getElementById('playAnimation').disabled = true;
        document.getElementById('pauseAnimation').disabled = false;
    }

    pause() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Update UI
        document.getElementById('playAnimation').disabled = false;
        document.getElementById('pauseAnimation').disabled = true;
    }

    reset() {
        this.pause();
        this.currentFrame = 0;
        
        // Update scrubber
        const scrubber = document.getElementById('animationScrubber');
        if (scrubber) {
            scrubber.value = 0;
            scrubber.max = this.totalFrames;
        }
        
        // Update UI
        document.getElementById('playAnimation').disabled = false;
        document.getElementById('pauseAnimation').disabled = true;
        
        this.render();
    }

    scrubTo(frame) {
        this.currentFrame = Math.max(0, Math.min(frame, this.totalFrames));
        this.render();
    }

    animate() {
        if (!this.isPlaying) return;
        
        this.currentFrame += this.speed;
        
        if (this.currentFrame >= this.totalFrames) {
            this.currentFrame = this.totalFrames;
            this.pause();
        }
        
        // Update scrubber
        const scrubber = document.getElementById('animationScrubber');
        if (scrubber) {
            scrubber.value = this.currentFrame;
        }
        
        this.render();
        
        if (this.isPlaying) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }

    render() {
        this.clearCanvas();
        
        if (!this.data) {
            this.renderEmptyState();
            return;
        }
        
        this.renderBackground();
        this.renderChannelInfrastructure();
        this.renderParticipants();
        this.renderQubits();
        this.renderLegend();
        this.renderMetrics();
    }

    clearCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.fillStyle = this.settings.colors.background;
        this.ctx.fillRect(0, 0, rect.width, rect.height);
    }

    renderEmptyState() {
        const rect = this.canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        this.ctx.fillStyle = '#9ca3af';
        this.ctx.textAlign = 'center';
        this.ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.fillText('Run simulation to visualize quantum channel', centerX, centerY);
        
        // Draw placeholder channel
        this.ctx.strokeStyle = '#d1d5db';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(50, centerY);
        this.ctx.lineTo(rect.width - 50, centerY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    renderBackground() {
        // Render subtle quantum grid pattern
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.05)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 20;
        for (let x = 0; x < rect.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, rect.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < rect.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(rect.width, y);
            this.ctx.stroke();
        }
    }

    renderChannelInfrastructure() {
        const rect = this.canvas.getBoundingClientRect();
        const channelY = this.settings.channelY;
        const channelHeight = this.settings.channelHeight;
        
        // Main quantum channel
        this.ctx.fillStyle = 'rgba(14, 165, 233, 0.1)';
        this.ctx.fillRect(100, channelY - channelHeight/2, rect.width - 200, channelHeight);
        
        this.ctx.strokeStyle = this.settings.colors.channel;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(100, channelY - channelHeight/2, rect.width - 200, channelHeight);
        
        // Channel label
        this.ctx.fillStyle = '#374151';
        this.ctx.textAlign = 'center';
        this.ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.fillText('Quantum Channel', rect.width / 2, channelY - channelHeight/2 - 10);
        
        // Distance and noise indicators
        if (this.data) {
            const distance = parseFloat(document.getElementById('distance')?.value || 10);
            const noise = parseFloat(document.getElementById('noise')?.value || 0.1);
            
            this.ctx.fillStyle = '#6b7280';
            this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`Distance: ${distance} km`, 110, channelY + channelHeight/2 + 20);
            this.ctx.fillText(`Noise: ${(noise * 100).toFixed(1)}%`, 110, channelY + channelHeight/2 + 35);
        }
    }

    renderParticipants() {
        const rect = this.canvas.getBoundingClientRect();
        
        // Alice (sender)
        this.renderParticipant('Alice', 50, this.settings.aliceY, this.settings.colors.alice, '📡');
        
        // Bob (receiver)
        this.renderParticipant('Bob', rect.width - 50, this.settings.bobY, this.settings.colors.bob, '📶');
        
        // Eve (eavesdropper) - only if attack is active
        if (this.data && this.data.eve_bases && this.data.eve_bases.length > 0) {
            this.renderParticipant('Eve', rect.width / 2, this.settings.eveY, this.settings.colors.eve, '🕵️');
        }
    }

    renderParticipant(name, x, y, color, icon) {
        // Circle background
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 25, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // White border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Icon (simplified text representation)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.fillText(name[0], x, y + 6);
        
        // Name label
        this.ctx.fillStyle = '#374151';
        this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.fillText(name, x, y + 45);
    }

    renderQubits() {
        if (!this.data || !this.data.alice_bits) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const bits = this.data.alice_bits;
        const aliceBases = this.data.alice_bases || '';
        const bobBases = this.data.bob_bases || '';
        const bobBits = this.data.bob_bits || '';
        const eveBases = this.data.eve_bases || '';
        
        const totalQubits = bits.length;
        const layout = this.calculateLayoutParameters(totalQubits, rect.width);
        
        const framesPerQubit = this.totalFrames / totalQubits;
        const currentQubit = Math.floor(this.currentFrame / framesPerQubit);
        const qubitProgress = (this.currentFrame % framesPerQubit) / framesPerQubit;
        
        // Update settings for this render
        this.settings.qubitSize = layout.qubitSize;
        this.settings.spacing = layout.spacing;
        
        // Render in compact mode for large numbers
        if (layout.isCompact) {
            this.renderQubitsCompact(bits, aliceBases, bobBases, bobBits, eveBases, layout, currentQubit, qubitProgress);
        } else {
            // Render completed qubits
            for (let i = 0; i < currentQubit && i < totalQubits; i++) {
                this.renderCompletedQubit(i, bits[i], aliceBases[i], bobBases[i], bobBits[i], eveBases[i], layout);
            }
            
            // Render current traveling qubit
            if (currentQubit < totalQubits) {
                this.renderTravelingQubit(currentQubit, bits[currentQubit], aliceBases[currentQubit], 
                                                bobBases[currentQubit], bobBits[currentQubit], eveBases[currentQubit], qubitProgress, layout);
            }
        }
        
        // Render qubit information panel
        this.renderQubitInfo(currentQubit, bits, aliceBases, bobBases, bobBits, eveBases);
    }
    
    renderQubitsCompact(bits, aliceBases, bobBases, bobBits, eveBases, layout, currentQubit, qubitProgress) {
        const rect = this.canvas.getBoundingClientRect();
        const startX = 120;
        const rowHeight = 120;
        
        // Render all qubits in grid layout
        for (let i = 0; i < bits.length; i++) {
            const row = Math.floor(i / layout.qubitsPerRow);
            const col = i % layout.qubitsPerRow;
            
            const x = startX + col * layout.spacing;
            const baseY = this.settings.channelY - 60 + row * rowHeight;
            
            const isActive = i <= currentQubit;
            const opacity = isActive ? 1.0 : 0.3;
            
            // Alice's qubit
            this.renderCompactQubit(x, baseY, bits[i], aliceBases[i], this.settings.colors.alice, opacity, 'A');
            
            // Channel connection
            if (isActive) {
                this.renderCompactConnection(x, baseY, baseY + 40, aliceBases[i] === bobBases[i]);
            }
            
            // Bob's qubit
            this.renderCompactQubit(x, baseY + 40, bobBits[i], bobBases[i], this.settings.colors.bob, opacity, 'B');
            
            // Eve's interception (if any)
            if (eveBases[i] && isActive) {
                this.renderCompactQubit(x + 15, baseY + 20, bits[i], eveBases[i], this.settings.colors.eve, opacity * 0.8, 'E');
            }
            
            // Highlight current qubit
            if (i === currentQubit) {
                this.renderCurrentQubitHighlight(x, baseY + 20, layout.qubitSize * 1.5);
            }
        }
        
        // Add compact mode indicator
        this.ctx.fillStyle = '#6b7280';
        this.ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Compact Mode: ${bits.length} qubits`, rect.width / 2, 25);
    }
    
    renderCompactQubit(x, y, bit, basis, color, opacity, label) {
        this.ctx.globalAlpha = opacity;
        
        const size = this.settings.qubitSize;
        
        // Qubit circle
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Bit value (smaller text for compact mode)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.font = `bold ${Math.max(8, size * 0.6)}px monospace`;
        this.ctx.fillText(bit, x, y + 3);
        
        // Basis indicator (minimal)
        if (basis) {
            this.ctx.fillStyle = color;
            this.ctx.font = `${Math.max(6, size * 0.4)}px monospace`;
            this.ctx.fillText(basis, x - size - 8, y + 3);
        }
        
        // Party label
        this.ctx.fillStyle = '#9ca3af';
        this.ctx.font = `${Math.max(6, size * 0.3)}px sans-serif`;
        this.ctx.fillText(label, x + size + 8, y + 3);
        
        this.ctx.globalAlpha = 1;
    }
    
    renderCompactConnection(x, y1, y2, matching) {
        this.ctx.strokeStyle = matching ? '#22c55e' : '#ef4444';
        this.ctx.lineWidth = matching ? 2 : 1;
        if (!matching) this.ctx.setLineDash([3, 3]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y1 + this.settings.qubitSize);
        this.ctx.lineTo(x, y2 - this.settings.qubitSize);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }
    
    renderCurrentQubitHighlight(x, y, radius) {
        // Animated highlight ring
        const pulseScale = 1 + 0.2 * Math.sin(Date.now() * 0.01);
        
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * pulseScale, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }

    renderCompletedQubit(index, bit, aliceBasis, bobBasis, bobBit, eveBasis) {
        const rect = this.canvas.getBoundingClientRect();
        const x = 150 + (index * this.settings.spacing);
        const y = this.settings.channelY;
        
        // Alice's qubit (sent)
        this.renderQubitElement(x - 40, this.settings.aliceY, bit, aliceBasis, this.settings.colors.alice, 0.7);
        
        // Channel trace
        this.renderChannelTrace(x - 40, x + 40, this.settings.aliceY, this.settings.bobY, 0.3);
        
        // Eve's interception (if any)
        if (eveBasis) {
            this.renderQubitElement(x, this.settings.eveY, bit, eveBasis, this.settings.colors.eve, 0.6);
            this.renderInterceptionIndicator(x, this.settings.eveY);
        }
        
        // Bob's measurement
        const matchingBases = aliceBasis === bobBasis;
        const correctMeasurement = bit === bobBit;
        const qubitColor = matchingBases ? 
            (correctMeasurement ? this.settings.colors.bob : this.settings.colors.intercepted) : 
            '#9ca3af';
        
        this.renderQubitElement(x + 40, this.settings.bobY, bobBit, bobBasis, qubitColor, 0.7);
        
        // Basis matching indicator
        if (matchingBases) {
            this.renderBasisMatch(x, this.settings.channelY);
        }
    }

    renderTravelingQubit(index, bit, aliceBasis, bobBasis, bobBit, eveBasis, progress) {
        const rect = this.canvas.getBoundingClientRect();
        const startX = 150 + (index * this.settings.spacing) - 40;
        const endX = 150 + (index * this.settings.spacing) + 40;
        const currentX = startX + (endX - startX) * progress;
        
        // Alice's qubit (source)
        this.renderQubitElement(startX, this.settings.aliceY, bit, aliceBasis, this.settings.colors.alice, 0.7);
        
        // Traveling photon
        const photonY = this.settings.aliceY + (this.settings.bobY - this.settings.aliceY) * progress;
        this.renderTravelingPhoton(currentX, photonY, bit, aliceBasis, progress);
        
        // Channel trace (animated)
        this.renderChannelTrace(startX, currentX, this.settings.aliceY, photonY, progress);
        
        // Eve's interception (if applicable and photon reached Eve)
        if (eveBasis && progress > 0.5) {
            this.renderQubitElement(150 + (index * this.settings.spacing), this.settings.eveY, 
                                  bit, eveBasis, this.settings.colors.eve, 0.6);
            this.renderInterceptionIndicator(150 + (index * this.settings.spacing), this.settings.eveY);
        }
        
        // Bob's measurement (if photon arrived)
        if (progress > 0.8) {
            const measurementProgress = (progress - 0.8) / 0.2;
            this.renderQubitElement(endX, this.settings.bobY, bobBit, bobBasis, 
                                  this.settings.colors.bob, measurementProgress * 0.7);
        }
    }

    renderQubitElement(x, y, bit, basis, color, opacity = 1) {
        this.ctx.globalAlpha = opacity;
        
        // Qubit circle
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.settings.qubitSize, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // White border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Bit value
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.fillText(bit, x, y + 5);
        
        // Basis indicator
        if (basis && this.settings.bases[basis]) {
            this.ctx.fillStyle = this.settings.bases[basis].color;
            this.ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            this.ctx.fillText(this.settings.bases[basis].symbol, x, y - 20);
        }
        
        this.ctx.globalAlpha = 1;
    }

    renderTravelingPhoton(x, y, bit, basis, progress) {
        // Animated photon with wave effect
        this.ctx.save();
        
        // Pulsing effect
        const pulseScale = 1 + 0.3 * Math.sin(progress * 4 * Math.PI);
        this.ctx.translate(x, y);
        this.ctx.scale(pulseScale, pulseScale);
        
        // Photon glow
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.settings.qubitSize * 1.5);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
        gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.4)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.settings.qubitSize * 1.5, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Core photon
        this.ctx.fillStyle = '#3b82f6';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.settings.qubitSize * 0.6, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Wave pattern
        this.ctx.strokeStyle = '#1d4ed8';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 8) {
            const waveX = Math.cos(angle + progress * 8) * this.settings.qubitSize * 0.4;
            const waveY = Math.sin(angle + progress * 8) * this.settings.qubitSize * 0.4;
            if (angle === 0) {
                this.ctx.moveTo(waveX, waveY);
            } else {
                this.ctx.lineTo(waveX, waveY);
            }
        }
        this.ctx.closePath();
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    renderChannelTrace(startX, endX, startY, endY, opacity = 0.5) {
        this.ctx.globalAlpha = opacity;
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1;
    }

    renderInterceptionIndicator(x, y) {
        // Warning symbol for Eve's interception
        this.ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 2;
        
        // Warning triangle
        this.ctx.beginPath();
        this.ctx.moveTo(x - 8, y + 25);
        this.ctx.lineTo(x + 8, y + 25);
        this.ctx.lineTo(x, y + 10);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Exclamation mark
        this.ctx.fillStyle = '#ef4444';
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.fillText('!', x, y + 22);
    }

    renderBasisMatch(x, y) {
        // Green checkmark for matching bases
        this.ctx.strokeStyle = '#22c55e';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(x - 8, y);
        this.ctx.lineTo(x - 3, y + 5);
        this.ctx.lineTo(x + 8, y - 5);
        this.ctx.stroke();
    }

    renderQubitInfo(currentQubit, bits, aliceBases, bobBases, bobBits, eveBases) {
        if (currentQubit >= bits.length) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const infoX = rect.width - 200;
        const infoY = 30;
        
        // Info panel background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.strokeStyle = '#e5e7eb';
        this.ctx.lineWidth = 1;
        this.ctx.fillRect(infoX, infoY, 180, 120);
        this.ctx.strokeRect(infoX, infoY, 180, 120);
        
        // Header
        this.ctx.fillStyle = '#374151';
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.fillText(`Qubit ${currentQubit + 1}/${bits.length}`, infoX + 10, infoY + 20);
        
        // Qubit details
        this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        let lineY = infoY + 40;
        
        const infoItems = [
            { label: 'Alice Bit:', value: bits[currentQubit], color: this.settings.colors.alice },
            { label: 'Alice Basis:', value: aliceBases[currentQubit], color: this.settings.colors.alice },
            { label: 'Bob Basis:', value: bobBases[currentQubit], color: this.settings.colors.bob },
            { label: 'Bob Bit:', value: bobBits[currentQubit], color: this.settings.colors.bob }
        ];
        
        if (eveBases[currentQubit]) {
            infoItems.push({ label: 'Eve Basis:', value: eveBases[currentQubit], color: this.settings.colors.eve });
        }
        
        infoItems.forEach(item => {
            this.ctx.fillStyle = '#6b7280';
            this.ctx.fillText(item.label, infoX + 10, lineY);
            
            this.ctx.fillStyle = item.color;
            this.ctx.font = 'bold 12px monospace';
            this.ctx.fillText(item.value || '?', infoX + 90, lineY);
            this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            
            lineY += 16;
        });
        
        // Basis matching status
        if (aliceBases[currentQubit] && bobBases[currentQubit]) {
            const match = aliceBases[currentQubit] === bobBases[currentQubit];
            this.ctx.fillStyle = match ? '#22c55e' : '#ef4444';
            this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            this.ctx.fillText(match ? '✓ Bases Match' : '✗ Bases Differ', infoX + 10, lineY + 10);
        }
    }

    renderLegend() {
        const rect = this.canvas.getBoundingClientRect();
        const legendX = 20;
        const legendY = rect.height - 120;
        
        // Legend background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.strokeStyle = '#e5e7eb';
        this.ctx.lineWidth = 1;
        this.ctx.fillRect(legendX, legendY, 160, 100);
        this.ctx.strokeRect(legendX, legendY, 160, 100);
        
        // Legend title
        this.ctx.fillStyle = '#374151';
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.fillText('Legend', legendX + 10, legendY + 15);
        
        // Legend items
        const legendItems = [
            { color: this.settings.colors.alice, label: 'Alice (Sender)' },
            { color: this.settings.colors.bob, label: 'Bob (Receiver)' },
            { color: this.settings.colors.eve, label: 'Eve (Eavesdropper)' },
            { color: '#3b82f6', label: 'Photon in Transit' }
        ];
        
        let itemY = legendY + 30;
        legendItems.forEach(item => {
            // Color indicator
            this.ctx.fillStyle = item.color;
            this.ctx.beginPath();
            this.ctx.arc(legendX + 15, itemY, 6, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Label
            this.ctx.fillStyle = '#374151';
            this.ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            this.ctx.fillText(item.label, legendX + 30, itemY + 4);
            
            itemY += 16;
        });
    }

    renderMetrics() {
        if (!this.data) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const metricsX = rect.width - 200;
        const metricsY = rect.height - 80;
        
        // Metrics background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.strokeStyle = '#e5e7eb';
        this.ctx.lineWidth = 1;
        this.ctx.fillRect(metricsX, metricsY, 180, 60);
        this.ctx.strokeRect(metricsX, metricsY, 180, 60);
        
        // Metrics content
        this.ctx.fillStyle = '#374151';
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.fillText('Real-time Metrics', metricsX + 10, metricsY + 15);
        
        this.ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.fillStyle = '#6b7280';
        
        const qber = (this.data.qber * 100).toFixed(1);
        const keyRate = this.data.key_generation_rate?.toFixed(1) || '0';
        
        this.ctx.fillText(`QBER: ${qber}%`, metricsX + 10, metricsY + 32);
        this.ctx.fillText(`Key Rate: ${keyRate} kbps`, metricsX + 10, metricsY + 47);
        
        // Security indicator
        const isSecure = this.data.is_secure;
        this.ctx.fillStyle = isSecure ? '#22c55e' : '#ef4444';
        this.ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(isSecure ? 'SECURE' : 'INSECURE', metricsX + 170, metricsY + 47);
    }

    // Public methods for external control
    start() {
        this.reset();
        this.play();
    }

    stop() {
        this.pause();
        this.reset();
    }

    setSpeed(speed) {
        this.speed = Math.max(0.1, Math.min(5, speed));
    }

    exportFrame() {
        return this.canvas.toDataURL('image/png');
    }

    // Resize handler
    resize() {
        this.setupCanvas();
        this.render();
    }
}

// Initialize visualization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Handle canvas resize on window resize
    window.addEventListener('resize', () => {
        const visualizer = window.quantumVisualizer;
        if (visualizer) {
            visualizer.resize();
        }
    });
});

// Export for global access
window.QuantumChannelVisualizer = QuantumChannelVisualizer;
