// BB84 QKD Simulator - Enhanced Main Application JavaScript
// Professional-grade quantum key distribution simulator with real device integration

class BB84Simulator {
    constructor() {
        this.currentSimulation = null;
        this.currentTestbed = null;
        this.animationState = {
            isPlaying: false,
            currentFrame: 0,
            totalFrames: 100
        };
        this.charts = {};
        this.dashboardCharts = {};
        this.currentSection = 'home';
        this.sessionToken = null;
        this.connectionPollInterval = null;
        this.dataPollInterval = null;
        this.visualizer = null;
        
        this.initializeApplication();
    }

    initializeApplication() {
        this.setupEventListeners();
        this.setupSliderUpdates();
        this.initializeCharts();
        this.initializeDashboardCharts();
        this.setupSectionNavigation();
        
        // Initialize quantum channel visualizer if canvas exists
        if (document.getElementById('animationCanvas')) {
            this.visualizer = new QuantumChannelVisualizer('animationCanvas');
        }
        
        this.log('BB84 QKD Simulator initialized successfully', 'success');
        
        // Make app globally accessible
        window.app = this;
    }

    setupEventListeners() {
        // Simulation controls
        const runSimulationBtn = document.getElementById('runSimulation');
        if (runSimulationBtn) {
            runSimulationBtn.addEventListener('click', () => this.runSimulation());
        }

        // Testbed controls
        const runTestbedBtn = document.getElementById('runTestbed');
        if (runTestbedBtn) {
            runTestbedBtn.addEventListener('click', () => this.runTestbed());
        }

        // Mobile device connection
        const connectMobileBtn = document.getElementById('connectMobile');
        if (connectMobileBtn) {
            connectMobileBtn.addEventListener('click', () => this.connectMobileDevice());
        }

        // QR code generation
        const generateQRBtn = document.getElementById('generateQR');
        if (generateQRBtn) {
            generateQRBtn.addEventListener('click', () => this.generateQRForMobile());
        }

        // Modal controls
        const closeModalBtn = document.getElementById('closeModal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeMobileModal());
        }

        // Scenario selection
        const scenarioRadios = document.querySelectorAll('input[name="scenario"]');
        scenarioRadios.forEach(radio => {
            radio.addEventListener('change', () => this.handleScenarioChange());
        });

        // Backend selection
        const backendRadios = document.querySelectorAll('input[name="backend"]');
        backendRadios.forEach(radio => {
            radio.addEventListener('change', () => this.handleBackendChange());
        });

        // Export results
        const exportBtn = document.getElementById('exportTestResults');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportResults());
        }

        // Animation controls
        const playBtn = document.getElementById('playAnimation');
        const pauseBtn = document.getElementById('pauseAnimation');
        const resetBtn = document.getElementById('resetAnimation');
        
        if (playBtn) playBtn.addEventListener('click', () => this.playAnimation());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pauseAnimation());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetAnimation());

        // Scenario presets
        const presetSelect = document.getElementById('scenarioPreset');
        if (presetSelect) {
            presetSelect.addEventListener('change', (e) => this.applyScenarioPreset(e.target.value));
        }
    }

    setupSliderUpdates() {
        const sliders = [
            { id: 'numQubits', display: 'numQubitsValue' },
            { id: 'photonRate', display: 'photonRateValue' },
            { id: 'distance', display: 'distanceValue', formatter: (v) => `${v} km` },
            { id: 'noise', display: 'noiseValue', formatter: (v) => parseFloat(v).toFixed(2) }
        ];

        sliders.forEach(({ id, display, formatter }) => {
            const slider = document.getElementById(id);
            const displayElement = document.getElementById(display);
            
            if (slider && displayElement) {
                slider.addEventListener('input', (e) => {
                    const value = formatter ? formatter(e.target.value) : e.target.value;
                    displayElement.textContent = value;
                });
            }
        });
    }

    handleScenarioChange() {
        const selectedScenario = document.querySelector('input[name="scenario"]:checked')?.value;
        
        const manualSection = document.getElementById('manualInputSection');
        const autoSection = document.getElementById('autoGenerationSection');
        
        if (manualSection && autoSection) {
            if (selectedScenario === 'manual') {
                manualSection.classList.remove('hidden');
                autoSection.classList.add('hidden');
            } else {
                manualSection.classList.add('hidden');
                autoSection.classList.remove('hidden');
            }
        }
    }

    handleBackendChange() {
        const selectedBackend = document.querySelector('input[name="backend"]:checked')?.value;
        
        if (selectedBackend === 'real_quantum') {
            this.showNotification('Real quantum devices are limited to 3-4 qubits', 'warning');
        }
    }

    applyScenarioPreset(preset) {
        const presets = {
            'secure_short': {
                distance: 5,
                noise: 0.02,
                eveAttack: 'none',
                numQubits: 16
            },
            'noisy_channel': {
                distance: 50,
                noise: 0.15,
                eveAttack: 'none',
                numQubits: 24
            },
            'eve_attack': {
                distance: 10,
                noise: 0.05,
                eveAttack: 'intercept_resend',
                numQubits: 12
            },
            'high_rate': {
                distance: 2,
                noise: 0.01,
                eveAttack: 'none',
                numQubits: 32
            }
        };

        if (presets[preset]) {
            const config = presets[preset];
            
            if (document.getElementById('distance')) {
                document.getElementById('distance').value = config.distance;
                document.getElementById('distanceValue').textContent = `${config.distance} km`;
            }
            
            if (document.getElementById('noise')) {
                document.getElementById('noise').value = config.noise;
                document.getElementById('noiseValue').textContent = config.noise;
            }
            
            if (document.getElementById('eveAttack')) {
                document.getElementById('eveAttack').value = config.eveAttack;
            }
            
            if (document.getElementById('numQubits')) {
                document.getElementById('numQubits').value = config.numQubits;
                document.getElementById('numQubitsValue').textContent = config.numQubits;
            }
        }
    }

    async runSimulation() {
        this.showLoading('Running BB84 simulation...');
        
        try {
            const params = this.collectSimulationParameters();
            
            const response = await fetch('/api/run_simulation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params)
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                this.displaySimulationResults(result);
                this.simulationData = result;
                
                if (this.visualizer) {
                    this.visualizer.setData(result);
                }
                
                this.showNotification('Simulation completed successfully!', 'success');
            } else {
                throw new Error(result.message || 'Simulation failed');
            }
        } catch (error) {
            console.error('Simulation error:', error);
            this.showNotification(`Simulation failed: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    collectSimulationParameters() {
        const scenario = document.querySelector('input[name="scenario"]:checked')?.value || 'manual';
        const backend = document.querySelector('input[name="backend"]:checked')?.value || 'classical';
        
        const params = {
            scenario: scenario,
            backend_type: backend,
            photon_rate: parseInt(document.getElementById('photonRate')?.value || 100),
            distance: parseFloat(document.getElementById('distance')?.value || 10),
            noise: parseFloat(document.getElementById('noise')?.value || 0.1),
            eve_attack: document.getElementById('eveAttack')?.value || 'none',
            error_correction: document.getElementById('errorCorrection')?.value || 'cascade',
            privacy_amplification: 'standard'
        };

        if (scenario === 'manual') {
            params.bits = document.getElementById('aliceBits')?.value || '0110';
            params.bases = document.getElementById('aliceBases')?.value || '+x+x';
        } else {
            params.num_qubits = parseInt(document.getElementById('numQubits')?.value || 8);
            params.rng_type = document.getElementById('rngType')?.value || 'classical';
        }

        if (backend === 'real_quantum') {
            params.api_key = document.getElementById('quantumApiKey')?.value || null;
        }

        return params;
    }

    displaySimulationResults(result) {
        // Update result cards
        const qberResult = document.getElementById('qberResult');
        if (qberResult) {
            qberResult.textContent = `${(result.qber * 100).toFixed(2)}%`;
        }

        const securityResult = document.getElementById('securityResult');
        if (securityResult) {
            securityResult.textContent = result.is_secure ? 'SECURE' : 'INSECURE';
            securityResult.className = result.is_secure ? 
                'text-lg font-bold text-success-green' : 
                'text-lg font-bold text-danger-red';
        }

        const keyRateResult = document.getElementById('keyRateResult');
        if (keyRateResult) {
            keyRateResult.textContent = `${result.key_generation_rate?.toFixed(1) || 0} kbps`;
        }

        const keyLengthResult = document.getElementById('keyLengthResult');
        if (keyLengthResult) {
            keyLengthResult.textContent = `${result.final_key?.length || 0} bits`;
        }

        // Update transmission table
        this.updateTransmissionTable(result);

        // Show results section
        const resultsSection = document.getElementById('simulationResults');
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
        }

        // Start quantum channel animation
        this.startQuantumChannelAnimation(result);
    }

    updateTransmissionTable(result) {
        const tableBody = document.getElementById('transmissionTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        const aliceBits = result.alice_bits || '';
        const aliceBases = result.alice_bases || '';
        const bobBases = result.bob_bases || '';
        const bobBits = result.bob_bits || '';
        const aliceSifted = result.alice_sifted || '';

        for (let i = 0; i < aliceBits.length; i++) {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';

            const baseMatch = aliceBases[i] === bobBases[i];
            const inFinalKey = i < aliceSifted.length;

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${i + 1}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">${aliceBits[i]}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">${aliceBases[i]}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">${bobBases[i]}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">${bobBits[i] || '?'}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        baseMatch ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }">
                        ${baseMatch ? '✓ Match' : '✗ Differ'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        inFinalKey ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }">
                        ${inFinalKey ? '✓ Included' : '✗ Discarded'}
                    </span>
                </td>
            `;

            tableBody.appendChild(row);
        }
    }

    startQuantumChannelAnimation(result) {
        const canvas = document.getElementById('animationCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = canvas.offsetWidth || 800;
        canvas.height = canvas.offsetHeight || 300;
        
        let animationFrame = 0;
        const totalFrames = 120;
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw quantum channel background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, 'rgba(26, 115, 232, 0.1)');
            gradient.addColorStop(0.5, 'rgba(26, 115, 232, 0.2)');
            gradient.addColorStop(1, 'rgba(26, 115, 232, 0.1)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw Alice and Bob stations
            const aliceX = 80;
            const bobX = canvas.width - 80;
            const centerY = canvas.height / 2;
            
            // Alice station
            ctx.fillStyle = '#1A73E8';
            ctx.fillRect(aliceX - 30, centerY - 20, 60, 40);
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Alice', aliceX, centerY + 5);
            ctx.fillText('(Sender)', aliceX, centerY + 50);
            
            // Bob station
            ctx.fillStyle = '#34A853';
            ctx.fillRect(bobX - 30, centerY - 20, 60, 40);
            ctx.fillStyle = 'white';
            ctx.fillText('Bob', bobX, centerY + 5);
            ctx.fillText('(Receiver)', bobX, centerY + 50);
            
            // Draw quantum channel line
            ctx.strokeStyle = '#E5E7EB';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(aliceX + 30, centerY);
            ctx.lineTo(bobX - 30, centerY);
            ctx.stroke();
            
            // Draw photons traveling
            const photonCount = Math.min(result.alice_bits ? result.alice_bits.length : 8, 8);
            for (let i = 0; i < photonCount; i++) {
                const progress = ((animationFrame + i * 15) % totalFrames) / totalFrames;
                const x = aliceX + 30 + progress * (bobX - aliceX - 60);
                const y = centerY + Math.sin(progress * Math.PI * 4) * 20;
                
                // Photon color based on bit value
                const bit = result.alice_bits ? result.alice_bits[i] : Math.random() > 0.5 ? '1' : '0';
                ctx.fillStyle = bit === '1' ? '#FF6B6B' : '#4ECDC4';
                
                // Draw photon with glow effect
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
                gradient.addColorStop(0, ctx.fillStyle);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = gradient;
                
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw polarization indicator
                const basis = result.alice_bases ? result.alice_bases[i] : (Math.random() > 0.5 ? '+' : 'x');
                ctx.strokeStyle = bit === '1' ? '#FF6B6B' : '#4ECDC4';
                ctx.lineWidth = 2;
                const angle = basis === 'x' ? Math.PI / 4 : 0;
                ctx.beginPath();
                ctx.moveTo(x - 6 * Math.cos(angle), y - 6 * Math.sin(angle));
                ctx.lineTo(x + 6 * Math.cos(angle), y + 6 * Math.sin(angle));
                ctx.stroke();
            }
            
            // Draw legend
            ctx.fillStyle = '#374151';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('Red: Bit 1', 20, 30);
            ctx.fillText('Blue: Bit 0', 20, 50);
            ctx.fillText('| : + basis', 20, 70);
            ctx.fillText('⟋ : x basis', 20, 90);
            
            animationFrame++;
            if (animationFrame < totalFrames * 3) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    async runTestbed() {
        this.showLoading('Analyzing quantum device...');
        
        try {
            const params = {
                photon_rate: document.getElementById('photonRate')?.value || 150,
                api_key: document.getElementById('quantumApiKey')?.value || null
            };
            
            const response = await fetch('/api/run_testbed', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params)
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                this.displayTestbedResults(result);
                this.updateTestbedCharts(result);
                this.showNotification('Device analysis completed!', 'success');
            } else {
                throw new Error(result.message || 'Testbed analysis failed');
            }
        } catch (error) {
            console.error('Testbed error:', error);
            this.showNotification(`Testbed analysis failed: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    displayTestbedResults(result) {
        // Update performance metrics
        const secureKeyRate = document.getElementById('secureKeyRate');
        if (secureKeyRate) {
            secureKeyRate.textContent = Math.round(result.metrics?.secure_key_rate || 0);
        }

        const detectionEfficiency = document.getElementById('detectionEfficiency');
        if (detectionEfficiency) {
            detectionEfficiency.textContent = `${(result.metrics?.detection_efficiency * 100 || 0).toFixed(1)}`;
        }

        const darkCountRate = document.getElementById('darkCountRate');
        if (darkCountRate) {
            darkCountRate.textContent = Math.round(result.metrics?.dark_count_rate || 0);
        }

        const deviceRating = document.getElementById('deviceRating');
        if (deviceRating) {
            deviceRating.textContent = result.analysis?.rating || 'N/A';
        }

        // Update test history
        this.addToTestHistory(result);
    }

    addToTestHistory(result) {
        const historyContainer = document.getElementById('testHistory');
        if (!historyContainer) return;

        // Clear "no results" message
        if (historyContainer.querySelector('.text-center')) {
            historyContainer.innerHTML = '';
        }

        const historyItem = document.createElement('div');
        historyItem.className = 'bg-gray-50 rounded-lg p-4 border border-gray-200';
        
        const timestamp = new Date(result.timestamp * 1000).toLocaleString();
        const rating = result.analysis?.rating || 'N/A';
        const ratingColor = this.getRatingColor(rating);

        historyItem.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-900">${timestamp}</span>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ratingColor}">
                    Rating: ${rating}
                </span>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>QBER: ${(result.metrics?.qber * 100 || 0).toFixed(2)}%</div>
                <div>Key Rate: ${Math.round(result.metrics?.secure_key_rate || 0)} bps</div>
                <div>Fidelity: ${(result.metrics?.fidelity || 0).toFixed(3)}</div>
                <div>Backend: ${result.device_info?.backend || 'Unknown'}</div>
            </div>
            <p class="text-xs text-gray-500 mt-2">${result.analysis?.recommendation || 'No recommendation available'}</p>
        `;

        historyContainer.insertBefore(historyItem, historyContainer.firstChild);

        // Keep only last 10 results
        while (historyContainer.children.length > 10) {
            historyContainer.removeChild(historyContainer.lastChild);
        }
    }

    getRatingColor(rating) {
        switch (rating) {
            case 'A': return 'bg-green-100 text-green-800';
            case 'B': return 'bg-blue-100 text-blue-800';
            case 'C': return 'bg-yellow-100 text-yellow-800';
            case 'D': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    initializeCharts() {
        // 🎌 Anime-style chart configurations
        const animeColors = {
            quantum: ['#FF6B9D', '#FFA07A', '#87CEEB', '#DDA0DD', '#F0E68C'],
            classical: ['#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
            neon: ['#FF073A', '#FF8C00', '#00FF7F', '#1E90FF', '#DA70D6']
        };

        // Initialize QBER charts (both IDs for compatibility)
        const qberCanvases = ['qberChart', 'qberAnalysisChart'];
        qberCanvases.forEach(canvasId => {
            const canvas = document.getElementById(canvasId);
            if (canvas) {
                this.charts[canvasId] = new Chart(canvas, {
                    type: 'line',
                    data: {
                        labels: [],
                        datasets: [{
                            label: '⚡ QBER %',
                            data: [],
                            borderColor: animeColors.neon[0],
                            backgroundColor: 'rgba(255, 7, 58, 0.2)',
                            borderWidth: 3,
                            tension: 0.4,
                            pointBackgroundColor: animeColors.neon[0],
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 6
                        }, {
                            label: '🛡️ Security Threshold',
                            data: [],
                            borderColor: animeColors.neon[1],
                            backgroundColor: 'rgba(255, 140, 0, 0.1)',
                            borderDash: [5, 5],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                    color: '#333',
                                    font: { weight: 'bold' },
                                    usePointStyle: true
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 50,
                                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                ticks: { color: '#666' }
                            },
                            x: {
                                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                ticks: { color: '#666' }
                            }
                        },
                        animation: {
                            duration: 2000,
                            easing: 'easeInOutBounce'
                        }
                    }
                });
            }
        });

        // Initialize detection/key rate charts
        const performanceCanvases = ['detectionChart', 'keyRateChart'];
        performanceCanvases.forEach(canvasId => {
            const canvas = document.getElementById(canvasId);
            if (canvas) {
                this.charts[canvasId] = new Chart(canvas, {
                    type: canvasId === 'keyRateChart' ? 'bar' : 'line',
                    data: {
                        labels: [],
                        datasets: [{
                            label: canvasId === 'keyRateChart' ? '🔑 Key Rate (bits/s)' : '⚡ Detection Efficiency %',
                            data: [],
                            borderColor: animeColors.neon[2],
                            backgroundColor: canvasId === 'keyRateChart' ? 
                                'rgba(0, 255, 127, 0.8)' : 'rgba(0, 255, 127, 0.2)',
                            borderWidth: 3,
                            tension: 0.4,
                            pointBackgroundColor: animeColors.neon[2],
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                    color: '#333',
                                    font: { weight: 'bold' },
                                    usePointStyle: true
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: canvasId === 'keyRateChart' ? undefined : 100,
                                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                ticks: { color: '#666' }
                            },
                            x: {
                                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                ticks: { color: '#666' }
                            }
                        },
                        animation: {
                            duration: 2000,
                            easing: 'easeInOutBounce'
                        }
                    }
                });
            }
        });

        // Initialize quantum vs classical comparison charts
        this.initializeComparisonCharts();
    }

    initializeDashboardCharts() {
        // Initialize quantum vs classical performance dashboard
        this.initializePerformanceDashboard();
        console.log('🎌 Anime-style dashboard charts initialized');
    }

    initializeComparisonCharts() {
        // 🎌 Quantum vs Classical Speed Comparison
        const speedCanvas = document.getElementById('speedComparisonChart');
        if (speedCanvas) {
            this.charts.speedComparison = new Chart(speedCanvas, {
                type: 'radar',
                data: {
                    labels: ['Preparation Speed', 'Transmission Speed', 'Measurement Speed', 'Processing Speed', 'Error Correction'],
                    datasets: [{
                        label: '⚛️ Quantum Registers',
                        data: [85, 95, 90, 75, 85],
                        borderColor: '#FF6B9D',
                        backgroundColor: 'rgba(255, 107, 157, 0.2)',
                        borderWidth: 3,
                        pointBackgroundColor: '#FF6B9D',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }, {
                        label: '💻 Classical Registers',
                        data: [95, 85, 95, 90, 95],
                        borderColor: '#4ECDC4',
                        backgroundColor: 'rgba(78, 205, 196, 0.2)',
                        borderWidth: 3,
                        pointBackgroundColor: '#4ECDC4',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { font: { weight: 'bold' } }
                        }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: { color: '#666' },
                            grid: { color: 'rgba(255, 255, 255, 0.2)' }
                        }
                    },
                    animation: { duration: 2500, easing: 'easeInOutQuart' }
                }
            });
        }

        // 🍩 Reliability Comparison Pie Chart
        const reliabilityCanvas = document.getElementById('reliabilityChart');
        if (reliabilityCanvas) {
            this.charts.reliability = new Chart(reliabilityCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['Quantum Advantage', 'Classical Reliability', 'Hybrid Performance'],
                    datasets: [{
                        data: [35, 45, 20],
                        backgroundColor: ['#FF6B9D', '#4ECDC4', '#87CEEB'],
                        borderColor: ['#FF1744', '#00BCD4', '#2196F3'],
                        borderWidth: 3,
                        hoverOffset: 15
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { font: { weight: 'bold' } }
                        }
                    },
                    animation: {
                        animateRotate: true,
                        duration: 3000
                    }
                }
            });
        }

        // 🎯 Efficiency vs Security Matrix
        const matrixCanvas = document.getElementById('efficiencyMatrix');
        if (matrixCanvas) {
            this.charts.efficiencyMatrix = new Chart(matrixCanvas, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: '⚛️ Quantum Systems',
                        data: [
                            {x: 85, y: 95}, {x: 90, y: 92}, {x: 78, y: 98},
                            {x: 82, y: 94}, {x: 88, y: 96}
                        ],
                        backgroundColor: '#FF6B9D',
                        borderColor: '#FF1744',
                        borderWidth: 2,
                        pointRadius: 8
                    }, {
                        label: '💻 Classical Systems',
                        data: [
                            {x: 95, y: 65}, {x: 92, y: 70}, {x: 98, y: 60},
                            {x: 90, y: 68}, {x: 94, y: 72}
                        ],
                        backgroundColor: '#4ECDC4',
                        borderColor: '#00BCD4',
                        borderWidth: 2,
                        pointRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { font: { weight: 'bold' } }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: { display: true, text: 'Efficiency %', font: { weight: 'bold' } },
                            min: 50, max: 100
                        },
                        y: {
                            display: true,
                            title: { display: true, text: 'Security %', font: { weight: 'bold' } },
                            min: 50, max: 100
                        }
                    },
                    animation: { duration: 2000 }
                }
            });
        }
    }

    initializePerformanceDashboard() {
        // 📊 Real-time performance metrics
        const performanceCanvas = document.getElementById('performanceDashboard');
        if (performanceCanvas) {
            this.charts.performance = new Chart(performanceCanvas, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: '⚛️ Quantum Performance',
                        data: [],
                        borderColor: '#FF6B9D',
                        backgroundColor: 'rgba(255, 107, 157, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    }, {
                        label: '💻 Classical Performance',
                        data: [],
                        borderColor: '#4ECDC4',
                        backgroundColor: 'rgba(78, 205, 196, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { font: { weight: 'bold' } }
                        }
                    },
                    scales: {
                        y: { beginAtZero: true, max: 100 }
                    },
                    animation: { duration: 1500 }
                }
            });
        }
    }

    updateTestbedCharts(result) {
        const timestamp = new Date().toLocaleTimeString();
        
        // Update QBER charts (both IDs)
        ['qber', 'qberAnalysisChart'].forEach(chartId => {
            if (this.charts[chartId]) {
                const qber = (result.metrics?.qber || 0) * 100;
                this.charts[chartId].data.labels.push(timestamp);
                this.charts[chartId].data.datasets[0].data.push(qber);
                
                // Add security threshold data
                if (this.charts[chartId].data.datasets[1]) {
                    this.charts[chartId].data.datasets[1].data.push(11); // 11% threshold
                }
                
                // Keep only last 20 data points
                if (this.charts[chartId].data.labels.length > 20) {
                    this.charts[chartId].data.labels.shift();
                    this.charts[chartId].data.datasets[0].data.shift();
                    if (this.charts[chartId].data.datasets[1]) {
                        this.charts[chartId].data.datasets[1].data.shift();
                    }
                }
                
                this.charts[chartId].update('none'); // Smooth animation
            }
        });

        // Update detection/key rate charts
        ['detectionChart', 'keyRateChart'].forEach(chartId => {
            if (this.charts[chartId]) {
                const value = chartId === 'keyRateChart' ? 
                    (result.metrics?.secure_key_rate || 0) : 
                    (result.metrics?.detection_efficiency || 0) * 100;
                    
                this.charts[chartId].data.labels.push(timestamp);
                this.charts[chartId].data.datasets[0].data.push(value);
                
                // Keep only last 20 data points
                if (this.charts[chartId].data.labels.length > 20) {
                    this.charts[chartId].data.labels.shift();
                    this.charts[chartId].data.datasets[0].data.shift();
                }
                
                this.charts[chartId].update('none');
            }
        });

        // 🎌 Update anime-style comparison charts with random battle data
        this.updateComparisonCharts(result);
        
        // Update performance dashboard
        this.updatePerformanceDashboard(result);
    }

    updateComparisonCharts(result) {
        // 🚀 Update speed comparison with dynamic data
        if (this.charts.speedComparison) {
            const quantumScores = [
                85 + Math.random() * 10,
                95 + Math.random() * 5,
                90 + Math.random() * 8,
                75 + Math.random() * 15,
                85 + Math.random() * 10
            ];
            const classicalScores = [
                95 + Math.random() * 5,
                85 + Math.random() * 10,
                95 + Math.random() * 5,
                90 + Math.random() * 8,
                95 + Math.random() * 5
            ];
            
            this.charts.speedComparison.data.datasets[0].data = quantumScores;
            this.charts.speedComparison.data.datasets[1].data = classicalScores;
            this.charts.speedComparison.update('active');
        }

        // 🍩 Update reliability pie chart
        if (this.charts.reliability) {
            const qber = (result.metrics?.qber || 0);
            const quantumAdv = qber < 0.05 ? 40 + Math.random() * 15 : 25 + Math.random() * 10;
            const classicalRel = 45 + Math.random() * 10;
            const hybridPerf = 100 - quantumAdv - classicalRel;
            
            this.charts.reliability.data.datasets[0].data = [quantumAdv, classicalRel, hybridPerf];
            this.charts.reliability.update('active');
        }

        // 🎯 Update efficiency matrix
        if (this.charts.efficiencyMatrix) {
            const quantumPoints = Array.from({length: 5}, () => ({
                x: 75 + Math.random() * 20,
                y: 85 + Math.random() * 15
            }));
            const classicalPoints = Array.from({length: 5}, () => ({
                x: 85 + Math.random() * 15,
                y: 60 + Math.random() * 15
            }));
            
            this.charts.efficiencyMatrix.data.datasets[0].data = quantumPoints;
            this.charts.efficiencyMatrix.data.datasets[1].data = classicalPoints;
            this.charts.efficiencyMatrix.update('active');
        }

        // 📊 Update anime battle stats
        this.updateBattleStats(result);
    }

    updatePerformanceDashboard(result) {
        if (this.charts.performance) {
            const timestamp = new Date().toLocaleTimeString();
            const quantumPerf = 70 + Math.random() * 25 + (result.is_secure ? 10 : -5);
            const classicalPerf = 80 + Math.random() * 15;
            
            this.charts.performance.data.labels.push(timestamp);
            this.charts.performance.data.datasets[0].data.push(quantumPerf);
            this.charts.performance.data.datasets[1].data.push(classicalPerf);
            
            // Keep only last 20 data points
            if (this.charts.performance.data.labels.length > 20) {
                this.charts.performance.data.labels.shift();
                this.charts.performance.data.datasets[0].data.shift();
                this.charts.performance.data.datasets[1].data.shift();
            }
            
            this.charts.performance.update('none');
        }
    }

    updateBattleStats(result) {
        // 🎌 Update anime-style battle stat cards
        const quantumScore = Math.min(100, 80 + (result.is_secure ? 15 : 5) + Math.random() * 10);
        const classicalScore = 75 + Math.random() * 15;
        const securityLevel = result.is_secure ? 90 + Math.random() * 10 : 60 + Math.random() * 20;
        const speedIndex = 85 + Math.random() * 15;
        
        // Update simulator battle stats
        const quantumScoreEl = document.getElementById('quantumScore');
        const classicalScoreEl = document.getElementById('classicalScore');
        const securityLevelEl = document.getElementById('securityLevel');
        const speedIndexEl = document.getElementById('speedIndex');
        
        if (quantumScoreEl) quantumScoreEl.textContent = Math.round(quantumScore);
        if (classicalScoreEl) classicalScoreEl.textContent = Math.round(classicalScore);
        if (securityLevelEl) securityLevelEl.textContent = Math.round(securityLevel);
        if (speedIndexEl) speedIndexEl.textContent = Math.round(speedIndex);
        
        // Update testbed battle stats
        const quantumDeviceScoreEl = document.getElementById('quantumDeviceScore');
        const classicalDeviceScoreEl = document.getElementById('classicalDeviceScore');
        const reliabilityScoreEl = document.getElementById('reliabilityScore');
        const testbedEfficiencyEl = document.getElementById('testbedEfficiency');
        
        if (quantumDeviceScoreEl) quantumDeviceScoreEl.textContent = Math.round(quantumScore - 5);
        if (classicalDeviceScoreEl) classicalDeviceScoreEl.textContent = Math.round(classicalScore);
        if (reliabilityScoreEl) reliabilityScoreEl.textContent = Math.round(95 + Math.random() * 5);
        if (testbedEfficiencyEl) testbedEfficiencyEl.textContent = Math.round(speedIndex);
        
        // Add cool animation effects
        this.animateBattleStats();
    }

    animateBattleStats() {
        // 🎌 Add anime-style flash animation to updated stats
        const battleCards = document.querySelectorAll('[id$="Score"], [id$="Level"], [id$="Index"], [id$="Efficiency"]');
        battleCards.forEach(card => {
            if (card) {
                card.style.transform = 'scale(1.1)';
                card.style.transition = 'transform 0.3s ease';
                setTimeout(() => {
                    card.style.transform = 'scale(1)';
                }, 300);
            }
        });
    }

    connectMobileDevice() {
        const modal = document.getElementById('deviceModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    closeMobileModal() {
        const modal = document.getElementById('deviceModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async generateQRForMobile() {
        try {
            const response = await fetch('/api/connect_mobile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                this.sessionToken = result.session_token;
                
                // Generate QR code
                const qrContainer = document.getElementById('qrCodeContainer');
                if (qrContainer && window.QRCode) {
                    qrContainer.innerHTML = '';
                    
                    new QRCode(qrContainer, {
                        text: result.qr_data,
                        width: 128,
                        height: 128,
                        colorDark: '#1A73E8',
                        colorLight: '#ffffff',
                        correctLevel: QRCode.CorrectLevel.M
                    });
                    
                    this.showNotification(`QR code generated! IP: ${result.local_ip || 'detected'}`, 'success');
                } else {
                    // Fallback: show text URL
                    if (qrContainer) {
                        qrContainer.innerHTML = `
                            <div class="text-xs text-gray-600 p-2 bg-gray-100 rounded">
                                <p class="mb-2">QR Code:</p>
                                <p class="font-mono break-all">${result.qr_data}</p>
                                <p class="mt-2 text-blue-600">Session: ${result.session_token.substring(0, 8)}...</p>
                            </div>
                        `;
                    }
                }
            } else {
                throw new Error(result.error || 'Failed to generate QR code');
            }
        } catch (error) {
            console.error('QR generation error:', error);
            this.showNotification(`Failed to generate QR code: ${error.message}`, 'error');
        }
    }

    exportResults() {
        if (!this.simulationData) {
            this.showNotification('No simulation data to export', 'warning');
            return;
        }

        const exportData = {
            timestamp: new Date().toISOString(),
            simulation_parameters: this.collectSimulationParameters(),
            results: this.simulationData
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bb84_simulation_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Results exported successfully!', 'success');
    }

    playAnimation() {
        this.animationState.isPlaying = true;
        const playBtn = document.getElementById('playAnimation');
        const pauseBtn = document.getElementById('pauseAnimation');
        
        if (playBtn) playBtn.disabled = true;
        if (pauseBtn) pauseBtn.disabled = false;
        
        if (this.visualizer) {
            this.visualizer.play();
        }
    }

    pauseAnimation() {
        this.animationState.isPlaying = false;
        const playBtn = document.getElementById('playAnimation');
        const pauseBtn = document.getElementById('pauseAnimation');
        
        if (playBtn) playBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
        
        if (this.visualizer) {
            this.visualizer.pause();
        }
    }

    resetAnimation() {
        this.animationState.isPlaying = false;
        this.animationState.currentFrame = 0;
        
        const playBtn = document.getElementById('playAnimation');
        const pauseBtn = document.getElementById('pauseAnimation');
        const scrubber = document.getElementById('animationScrubber');
        
        if (playBtn) playBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
        if (scrubber) scrubber.value = 0;
        
        if (this.visualizer) {
            this.visualizer.reset();
        }
    }

    setupSectionNavigation() {
        // Section navigation setup
        console.log('Section navigation setup complete');
    }

    showLoading(message = 'Processing...') {
        const overlay = document.getElementById('loadingOverlay');
        const messageEl = document.getElementById('loadingMessage');
        
        if (overlay) {
            overlay.classList.remove('hidden');
        }
        
        if (messageEl) {
            messageEl.textContent = message;
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 max-w-sm bg-white rounded-lg shadow-lg border-l-4 p-4 ${this.getNotificationColor(type)}`;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    ${this.getNotificationIcon(type)}
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium text-gray-900">${message}</p>
                </div>
                <div class="ml-auto pl-3">
                    <button class="inline-flex text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <span class="sr-only">Close</span>
                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationColor(type) {
        switch (type) {
            case 'success': return 'border-green-500';
            case 'error': return 'border-red-500';
            case 'warning': return 'border-yellow-500';
            default: return 'border-blue-500';
        }
    }

    getNotificationIcon(type) {
        const iconClass = 'h-5 w-5';
        switch (type) {
            case 'success':
                return `<svg class="${iconClass} text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`;
            case 'error':
                return `<svg class="${iconClass} text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>`;
            case 'warning':
                return `<svg class="${iconClass} text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>`;
            default:
                return `<svg class="${iconClass} text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>`;
        }
    }

    log(message, level = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BB84Simulator();
});

// Export for global access
window.BB84Simulator = BB84Simulator;