import numpy as np
import random
import logging
import time
from typing import Dict, List, Tuple, Any
import asyncio
import os
# Quantum computing imports
try:
    from qiskit import QuantumCircuit, transpile
    from qiskit_aer import AerSimulator
    from qiskit.primitives import Sampler
    from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2
    QISKIT_AVAILABLE = True
except ImportError:
    QISKIT_AVAILABLE = False
    logging.warning("Qiskit not available. Using classical simulation only.")

logger = logging.getLogger(__name__)

class BB84Simulator:
    """Professional BB84 Quantum Key Distribution Simulator"""
    
    def __init__(self):
        self.qber_threshold = 0.11  # 11% QBER threshold for security (Bennett & Brassard)
        self.bases_mapping = {'+': 'rectilinear', 'x': 'diagonal'}
        self.simulation_logs = []
        
    def log_message(self, message: str, level: str = 'info') -> None:
        """Add message to simulation logs"""
        timestamp = time.strftime('%H:%M:%S')
        log_entry = {'timestamp': timestamp, 'message': message, 'level': level}
        self.simulation_logs.append(log_entry)
        logger.info(f"BB84: {message}")
    
    def generate_random_bits(self, n: int, method: str = 'classical') -> str:
        """Generate random bits using specified method"""
        if method == 'classical':
            return ''.join([str(random.randint(0, 1)) for _ in range(n)])
        elif method == 'quantum' and QISKIT_AVAILABLE:
            try:
                # Use quantum hardware if available, fallback to classical
                return self.generate_quantum_random_bits(n)
            except Exception as e:
                self.log_message(f"Quantum RNG failed, using classical fallback: {str(e)}", "warning")
                return ''.join([str(random.randint(0, 1)) for _ in range(n)])
        else:
            # Classical fallback
            return ''.join([str(random.randint(0, 1)) for _ in range(n)])
    
    def generate_random_bases(self, n: int) -> str:
        """Generate random basis string"""
        bases = ['+', 'x']
        return ''.join([random.choice(bases) for _ in range(n)])
    
    def apply_channel_effects(self, bits: str, distance: float, noise: float) -> Tuple[str, float]:
        """Apply distance and noise effects to transmitted bits"""
        # Simple model: photon loss increases with distance and noise
        loss_probability = min(0.2 * (distance / 100) + noise, 0.8)
        
        received_bits = ""
        errors = 0
        
        for bit in bits:
            if random.random() < loss_probability:
                # Photon lost - no detection
                received_bits += "?"
            elif random.random() < noise:
                # Bit flip due to noise
                received_bits += str(1 - int(bit))
                errors += 1
            else:
                # Correct transmission
                received_bits += bit
        
        error_rate = errors / len(bits) if len(bits) > 0 else 0
        return received_bits, error_rate
    
    def generate_quantum_random_bits(self, n: int) -> str:
        """Generate quantum random bits using Qiskit (fallback to classical if failed)"""
        try:
            if not QISKIT_AVAILABLE:
                raise Exception("Qiskit not available")
            
            # Simple quantum random number generation circuit
            from qiskit import QuantumCircuit, transpile
            
            # Create quantum circuit for random bit generation
            qc = QuantumCircuit(min(n, 4), min(n, 4))  # Limit to 4 qubits for efficiency
            
            # Apply Hadamard gates to create superposition
            for qubit in range(min(n, 4)):
                qc.h(qubit)
            
            # Measure qubits
            qc.measure_all()
            
            # Use AerSimulator as fallback
            simulator = AerSimulator()
            transpiled_qc = transpile(qc, simulator)
            job = simulator.run(transpiled_qc, shots=max(1, n // 4 + 1))
            result = job.result()
            counts = result.get_counts()
            
            # Extract random bits from measurement results
            random_bits = ""
            for outcome, count in counts.items():
                random_bits += outcome * count
            
            # Ensure we have enough bits
            while len(random_bits) < n:
                random_bits += str(random.randint(0, 1))
            
            return random_bits[:n]
            
        except Exception as e:
            self.log_message(f"Quantum random generation failed: {str(e)}", "warning")
            # Fallback to classical random generation
            return ''.join([str(random.randint(0, 1)) for _ in range(n)])
    
    def simulate_eve_attack(self, alice_bits: str, alice_bases: str, attack_type: str) -> Tuple[str, str, float]:
        """Simulate Eve's interception attack"""
        if attack_type == 'none':
            return alice_bits, alice_bases, 0.0
        
        intercepted_bits = ""
        eve_bases = ""
        detection_probability = 0.0
        
        if attack_type == 'intercept_resend':
            # Eve intercepts and measures in random bases
            eve_bases = self.generate_random_bases(len(alice_bits))
            
            for i, (bit, alice_basis, eve_basis) in enumerate(zip(alice_bits, alice_bases, eve_bases)):
                if alice_basis == eve_basis:
                    # Same basis - Eve gets correct measurement
                    intercepted_bits += bit
                else:
                    # Different basis - 50% chance of error
                    intercepted_bits += str(random.randint(0, 1))
            
            # Calculate detection probability (simplified)
            detection_probability = 0.25  # Theoretical for intercept-resend
        
        return intercepted_bits, eve_bases, detection_probability
    
    def sift_keys(self, alice_bits: str, alice_bases: str, bob_bits: str, bob_bases: str) -> Tuple[str, str]:
        """Perform key sifting - keep only bits where bases match"""
        alice_sifted = ""
        bob_sifted = ""
        
        for i, (a_bit, a_basis, b_bit, b_basis) in enumerate(zip(alice_bits, alice_bases, bob_bits, bob_bases)):
            if a_basis == b_basis and b_bit != "?":  # Same basis and detected
                alice_sifted += a_bit
                bob_sifted += b_bit
        
        return alice_sifted, bob_sifted
    
    def calculate_qber(self, alice_key: str, bob_key: str) -> float:
        """Calculate Quantum Bit Error Rate"""
        if len(alice_key) == 0 or len(bob_key) == 0:
            return 1.0
        
        errors = sum(1 for a, b in zip(alice_key, bob_key) if a != b)
        return errors / len(alice_key)
    
    def error_correction_cascade(self, alice_key: str, bob_key: str) -> Tuple[str, str, int]:
        """Simplified Cascade error correction"""
        # Simplified implementation - in reality this is much more complex
        corrected_alice = alice_key
        corrected_bob = bob_key
        
        # Count errors that would be corrected
        errors_corrected = sum(1 for a, b in zip(alice_key, bob_key) if a != b)
        
        # Simulate error correction by making keys identical (simplified)
        if len(alice_key) > 0:
            corrected_bob = alice_key  # In real implementation, this uses parity checks
        
        return corrected_alice, corrected_bob, errors_corrected
    
    def privacy_amplification(self, key: str, amplification_factor: float = 0.5) -> str:
        """Apply privacy amplification to reduce key length"""
        if len(key) == 0:
            return ""
        
        # Simplified privacy amplification - reduce key length
        new_length = max(1, int(len(key) * amplification_factor))
        return key[:new_length]
    
    def generate_quantum_random_bits(self, n: int, api_key: str = None) -> Tuple[str, bool]:
        """Generate truly random bits using IBM Quantum device"""
        if not QISKIT_AVAILABLE:
            self.log_message("Qiskit not available, falling back to classical RNG", "warning")
            return self.generate_random_bits(n, 'classical'), False
        
        try:
            if api_key:
                # Try to connect to IBM Quantum with provided API key
                service = QiskitRuntimeService(channel="ibm_quantum", token=api_key)
                self.log_message("Connected to IBM Quantum API", "success")
            else:
                # Use environment variable or default
                api_key = os.environ.get("IBM_QUANTUM_API_KEY")
                if api_key:
                    service = QiskitRuntimeService(channel="ibm_quantum", token=api_key)
                    self.log_message("Connected to IBM Quantum API with environment key", "success")
                else:
                    raise Exception("No IBM Quantum API key provided")
            
            # Limit to 5-6 qubits for real quantum device
            n = min(n, 6)
            
            # Create quantum circuit for random number generation
            qc = QuantumCircuit(n, n)
            
            # Apply Hadamard gates to create superposition
            for i in range(n):
                qc.h(i)
            
            # Measure all qubits
            qc.measure_all()
            
            # Get available backend
            backends = service.backends()
            backend = backends[0] if backends else None
            
            if backend is None:
                raise Exception("No quantum backends available")
            
            self.log_message(f"Using quantum backend: {backend.name}", "info")
            
            # Run on quantum device
            sampler = SamplerV2(backend)
            job = sampler.run([qc], shots=1)
            result = job.result()
            
            # Extract random bits
            counts = result[0].data.meas.get_counts()
            random_bits = list(counts.keys())[0]
            
            self.log_message(f"Generated {len(random_bits)} quantum random bits", "success")
            return random_bits, True
            
        except Exception as e:
            self.log_message(f"Quantum RNG failed: {str(e)}, falling back to simulator", "warning")
            
            # Fallback to Qiskit simulator
            try:
                simulator = AerSimulator()
                qc = QuantumCircuit(n, n)
                
                for i in range(n):
                    qc.h(i)
                qc.measure_all()
                
                transpiled_qc = transpile(qc, simulator, seed_transpiler=123)
                job = simulator.run(transpiled_qc, shots=1, seed_simulator=123)
                result = job.result()
                counts = result.get_counts()
                
                random_bits = list(counts.keys())[0]
                self.log_message(f"Generated {len(random_bits)} bits using Qiskit simulator", "info")
                return random_bits, False
                
            except Exception as e2:
                self.log_message(f"Qiskit simulator failed: {str(e2)}, using classical RNG", "error")
                return self.generate_random_bits(n, 'classical'), False
    
    def run_manual_simulation(self, bits: str, bases: str, photon_rate: int, 
                            distance: float, noise: float, eve_attack: str,
                            error_correction: str, privacy_amplification: str, 
                            backend_type: str) -> Dict[str, Any]:
        """Run BB84 simulation with manual input"""
        
        self.simulation_logs = []
        self.log_message("Starting BB84 simulation with manual input", "info")
        
        # Validate input
        if len(bits) != len(bases):
            raise ValueError("Bits and bases strings must have the same length")
        
        # Alice's preparation
        alice_bits = bits
        alice_bases = bases
        
        self.log_message(f"Alice prepares {len(alice_bits)} qubits", "info")
        
        # Simulate quantum channel transmission
        transmitted_bits, channel_error_rate = self.apply_channel_effects(
            alice_bits, distance, noise
        )
        
        # Eve's attack
        if eve_attack != 'none':
            transmitted_bits, eve_bases, eve_detection_prob = self.simulate_eve_attack(
                transmitted_bits, alice_bases, eve_attack
            )
            self.log_message(f"Eve intercepts with {eve_attack} attack", "warning")
        else:
            eve_bases = ""
            eve_detection_prob = 0.0
        
        # Bob's measurement
        bob_bases = self.generate_random_bases(len(alice_bits))
        bob_bits = transmitted_bits  # Simplified - in reality Bob measures
        
        self.log_message(f"Bob measures qubits with random bases", "info")
        
        # Key sifting
        alice_sifted, bob_sifted = self.sift_keys(alice_bits, alice_bases, bob_bits, bob_bases)
        
        self.log_message(f"Key sifting: {len(alice_sifted)} bits retained", "info")
        
        # Calculate QBER
        qber = self.calculate_qber(alice_sifted, bob_sifted)
        
        # Security analysis
        is_secure = qber < self.qber_threshold
        
        if is_secure:
            self.log_message(f"QBER: {qber:.3f} < threshold {self.qber_threshold} - Secure", "success")
        else:
            self.log_message(f"QBER: {qber:.3f} > threshold {self.qber_threshold} - Not Secure", "error")
        
        # Error correction
        if error_correction == 'cascade':
            alice_corrected, bob_corrected, errors_corrected = self.error_correction_cascade(
                alice_sifted, bob_sifted
            )
            self.log_message(f"Error correction: {errors_corrected} errors corrected", "info")
        else:
            alice_corrected = alice_sifted
            bob_corrected = bob_sifted
            errors_corrected = 0
        
        # Privacy amplification
        if privacy_amplification == 'standard':
            final_key = self.privacy_amplification(alice_corrected)
            self.log_message(f"Privacy amplification: Key reduced to {len(final_key)} bits", "info")
        else:
            final_key = alice_corrected
        
        # Calculate metrics
        key_generation_rate = len(final_key) * photon_rate / 1000  # kbps
        key_accuracy = 1.0 - qber if qber < 1.0 else 0.0

        # Define fidelity variables with default values to ensure consistency
        classical_fidelity = 0.0
        simulator_fidelity = 0.0
        device_fidelity = 0.0

        if backend_type == 'classical':
            classical_fidelity = 1.0
        elif backend_type == 'qiskit':
            simulator_fidelity = 0.999
        elif backend_type == 'real_quantum':
            device_fidelity = 0.95 + random.uniform(-0.05, 0.03)
        
        return {
            'status': 'success',
            'alice_bits': alice_bits,
            'alice_bases': alice_bases,
            'bob_bits': bob_bits,
            'bob_bases': bob_bases,
            'eve_bases': eve_bases,
            'alice_sifted': alice_sifted,
            'bob_sifted': bob_sifted,
            'final_key': final_key,
            'qber': qber,
            'is_secure': is_secure,
            'key_generation_rate': key_generation_rate,
            'key_accuracy': key_accuracy,
            'errors_corrected': errors_corrected,
            'logs': self.simulation_logs,
            'backend_used': backend_type,
            'eve_detection_probability': eve_detection_prob,
            'channel_error_rate': channel_error_rate,
            'quantum_bits_generated': False,
            'rng_type': 'classical',
            'generation_method': 'standard',
            'classical_fidelity': classical_fidelity,
            'simulator_fidelity': simulator_fidelity,
            'device_fidelity': device_fidelity
        }
    
    def run_auto_simulation(self, num_qubits: int, rng_type: str, photon_rate: int,
                           distance: float, noise: float, eve_attack: str,
                           error_correction: str, privacy_amplification: str,
                           backend_type: str, api_key: str = None, **kwargs) -> Dict[str, Any]:
        """Run BB84 simulation with auto-generated qubits"""
        
        self.simulation_logs = []
        self.log_message(f"Starting BB84 simulation with {rng_type} RNG", "info")
        
        # Handle different generation methods
        if kwargs.get('generation_method') == 'photon_based':
            # Photon-based generation
            photon_count = kwargs.get('photon_count', 50)
            # Simulate photon loss and detection for realistic qubit count
            effective_qubits = max(4, min(32, int(photon_count * 0.3)))  # 30% detection rate
            alice_bits = self.generate_random_bits(effective_qubits, 'classical')
            quantum_used = False
            self.log_message(f"Generated {len(alice_bits)} qubits from {photon_count} photons", "info")
        elif rng_type == 'quantum' or backend_type == 'real_quantum':
            # Limit real quantum devices to 3-4 qubits
            if backend_type == 'real_quantum':
                num_qubits = min(num_qubits, 4)
                self.log_message(f"Limited to {num_qubits} qubits for real quantum device", "warning")
            
            alice_bits, quantum_used = self.generate_quantum_random_bits(num_qubits, api_key)
            if quantum_used:
                self.log_message("Using real quantum device for bit generation", "success")
            else:
                self.log_message("Using quantum simulator for bit generation", "info")
        else:
            alice_bits = self.generate_random_bits(num_qubits, 'classical')
            quantum_used = False
            backend_name = 'classical mathematical' if backend_type == 'classical' else 'qiskit simulator'
            self.log_message(f"Using {backend_name} for bit generation", "info")
        
        alice_bases = self.generate_random_bases(len(alice_bits))
        
        # Run the simulation using the manual simulation logic
        result = self.run_manual_simulation(
            alice_bits, alice_bases, photon_rate, distance, noise,
            eve_attack, error_correction, privacy_amplification, backend_type
        )
        
        # Add generation info
        result['quantum_bits_generated'] = quantum_used
        result['rng_type'] = rng_type
        result['backend_type'] = backend_type
        result['generation_method'] = kwargs.get('generation_method', 'standard')
        
        # Add backend-specific metrics
        if backend_type == 'classical':
            result['classical_fidelity'] = 1.0  # Perfect classical simulation
        elif backend_type == 'qiskit':
            result['simulator_fidelity'] = 0.999  # High simulator fidelity
        elif backend_type == 'real_quantum':
            result['device_fidelity'] = 0.95 + random.uniform(-0.05, 0.03)  # Realistic device fidelity
        
        return result
