import logging
import json
import time
import secrets
from datetime import datetime
from flask import render_template, request, jsonify
from app import app
from bb84_simulator import BB84Simulator
from quantum_device import QuantumDeviceTestbed
from firebase_config import save_testbed_result, get_testbed_results

logger = logging.getLogger(__name__)

@app.route('/')
def index():
    """Render the homepage."""
    return render_template('index.html')

@app.route('/simulator')
def simulator():
    """Render the BB84 simulator page."""
    return render_template('simulator.html')

@app.route('/testbed')
def testbed():
    """Render the quantum device testbed page."""
    return render_template('testbed.html')

@app.route('/mobile/<token>')
def mobile_interface(token):
    """Render the mobile device interface page."""
    return render_template('mobile.html', session_token=token)

@app.route('/api/run_simulation', methods=['POST'])
def run_simulation():
    """Run BB84 simulation with given parameters"""
    try:
        data = request.get_json()
        logger.info(f"Received simulation request: {data}")
        
        # Extract parameters
        scenario = data.get('scenario', 'manual')
        bits = data.get('bits', '0110')
        bases = data.get('bases', '+x+x')
        num_qubits = data.get('num_qubits', 4)
        rng_type = data.get('rng_type', 'classical')
        photon_rate = data.get('photon_rate', 100)
        photon_count = data.get('photon_count', 50)
        generation_method = data.get('generation_method', 'standard')
        distance = data.get('distance', 10)
        noise = data.get('noise', 0.1)
        eve_attack = data.get('eve_attack', 'none')
        error_correction = data.get('error_correction', 'cascade')
        privacy_amplification = data.get('privacy_amplification', 'standard')
        backend_type = data.get('backend_type', 'classical')
        api_key = data.get('api_key', None)
        
        # Initialize simulator
        simulator = BB84Simulator()
        
        # Run simulation based on scenario
        if scenario == 'manual':
            result = simulator.run_manual_simulation(
                bits, bases, photon_rate, distance, noise, 
                eve_attack, error_correction, privacy_amplification, backend_type
            )
        elif scenario == 'auto':
            result = simulator.run_auto_simulation(
                num_qubits, rng_type, photon_rate, distance, noise,
                eve_attack, error_correction, privacy_amplification, backend_type, api_key
            )
        elif scenario == 'photon':
            result = simulator.run_auto_simulation(
                num_qubits, 'classical', photon_rate, distance, noise,
                eve_attack, error_correction, privacy_amplification, backend_type, api_key,
                generation_method=generation_method, photon_count=photon_count
            )
        else:
            # Default to auto for backward compatibility
            result = simulator.run_auto_simulation(
                num_qubits, rng_type, photon_rate, distance, noise,
                eve_attack, error_correction, privacy_amplification, backend_type, api_key
            )
        
        logger.info("Simulation completed successfully")
        return jsonify(result)

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}", exc_info=True)
        return jsonify({
            'error': str(e),
            'status': 'error',
            'message': str(e)
        }), 400  # Return a 400 Bad Request status code
     
    except Exception as e:
        logger.error(f"Simulation error: {str(e)}", exc_info=True)
        return jsonify({
            'error': str(e),
            'status': 'error',
            'message': 'Simulation failed. Please check your parameters and try again.'
        }), 500

@app.route('/api/run_testbed', methods=['POST'])
def run_testbed():
    """Run quantum device testbed analysis"""
    try:
        data = request.get_json()
        logger.info(f"Received testbed request: {data}")
        
        photon_rate = int(data.get('photon_rate', 150))  # Convert to int to fix TypeError
        api_key = data.get('api_key', None)
        
        # Initialize testbed
        testbed = QuantumDeviceTestbed()
        
        # Run testbed analysis
        result = testbed.analyze_device(photon_rate, api_key)
        
        # Save result to Firebase
        try:
            save_testbed_result(result)
            logger.info("Testbed result saved to Firebase")
        except Exception as e:
            logger.warning(f"Failed to save to Firebase: {str(e)}")
        
        logger.info("Testbed analysis completed successfully")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Testbed error: {str(e)}", exc_info=True)
        return jsonify({
            'error': str(e),
            'status': 'error',
            'message': 'Testbed analysis failed. Please check your API key and try again.'
        }), 500

@app.route('/api/testbed_history', methods=['GET'])
def get_testbed_history():
    """Get testbed experiment history"""
    try:
        results = get_testbed_results()
        return jsonify({'status': 'success', 'results': results})
    except Exception as e:
        logger.error(f"Failed to retrieve testbed history: {str(e)}")
        return jsonify({
            'error': str(e),
            'status': 'error',
            'message': 'Failed to retrieve experiment history'
        }), 500

# Global storage for connected mobile devices
connected_devices = {}

def get_local_ip():
    """Get the local network IP address for mobile connections"""
    import socket
    try:
        # Connect to a remote address to determine the local IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))  # Google DNS
            local_ip = s.getsockname()[0]
            return local_ip
    except Exception:
        # Fallback to localhost if detection fails
        return "127.0.0.1"

@app.route('/api/connect_mobile', methods=['POST'])
def connect_mobile():
    """Generate connection token for mobile device"""
    try:
        import uuid
        
        # Generate unique session token
        session_token = str(uuid.uuid4())
        
        # Store connection session
        connected_devices[session_token] = {
            'token': session_token,
            'connected_at': time.time(),
            'last_data': None,
            'status': 'waiting_for_device',
            'data_received': False
        }
        
        # Get the local network IP for mobile connectivity
        local_ip = get_local_ip()
        mobile_url = f"http://{local_ip}:5000/mobile/{session_token}"
        
        logger.info(f"Mobile connection initiated with token: {session_token}")
        logger.info(f"Mobile URL: {mobile_url}")
        
        return jsonify({
            'status': 'success',
            'session_token': session_token,
            'qr_data': mobile_url,
            'local_ip': local_ip,  # Include for debugging
            'expires_in': 300  # 5 minutes
        })
        
    except Exception as e:
        logger.error(f"Mobile connection error: {str(e)}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

@app.route('/api/register_mobile_device', methods=['POST'])
def register_mobile_device():
    """Register a mobile device for quantum measurements"""
    try:
        data = request.get_json()
        device_id = data.get('device_id')
        device_token = data.get('device_token', 'default_token')
        device_info = data.get('device_info', {})
        
        if not device_id:
            return jsonify({
                'error': 'device_id is required',
                'status': 'error'
            }), 400
        
        # Store device registration
        connected_devices[device_id] = {
            'token': device_token,
            'info': device_info,
            'connected_at': time.time(),
            'last_data': None
        }
        
        logger.info(f"Mobile device registered: {device_id}")
        
        return jsonify({
            'status': 'success',
            'message': 'Device registered successfully',
            'device_id': device_id,
            'auth_token': device_token
        })
        
    except Exception as e:
        logger.error(f"Device registration error: {str(e)}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

@app.route('/api/submit_mobile_data', methods=['POST'])
def submit_mobile_data():
    """Receive real-time quantum measurement data from mobile devices"""
    try:
        data = request.get_json()
        session_token = data.get('session_token')
        
        if not session_token or session_token not in connected_devices:
            return jsonify({
                'error': 'Invalid session token',
                'status': 'error'
            }), 401
        
        # Get measurement data
        mobile_data = data.get('measurements', {})
        logger.info(f"Received mobile data from session {session_token}: {mobile_data}")
        
        # Process the data using QuantumDeviceTestbed
        testbed = QuantumDeviceTestbed()
        result = testbed.analyze_mobile_data(mobile_data)
        
        # Update session with received data
        connected_devices[session_token].update({
            'last_data': time.time(),
            'status': 'data_received',
            'data_received': True,
            'result': result
        })
        
        # Save result to Firebase if available
        try:
            save_testbed_result(result)
            logger.info("Mobile testbed result saved to Firebase")
        except Exception as e:
            logger.warning(f"Failed to save mobile result to Firebase: {str(e)}")
        
        logger.info(f"Mobile data processed successfully for session {session_token}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Mobile data processing error: {str(e)}", exc_info=True)
        return jsonify({
            'error': str(e),
            'status': 'error',
            'message': 'Failed to process mobile measurement data'
        }), 500

@app.route('/api/submit_mobile_results', methods=['POST'])
def submit_mobile_results():
    """Receive real-time quantum measurement data from mobile devices"""
    try:
        # Check authentication
        auth_token = request.headers.get('Authorization', '').replace('Bearer ', '')
        device_id = request.headers.get('X-Device-ID')
        
        if not device_id or device_id not in connected_devices:
            return jsonify({
                'error': 'Device not registered',
                'status': 'error'
            }), 401
        
        if connected_devices[device_id]['token'] != auth_token:
            return jsonify({
                'error': 'Invalid authentication token',
                'status': 'error'
            }), 401
        
        # Get measurement data
        mobile_data = request.get_json()
        logger.info(f"Received mobile data from {device_id}: {mobile_data}")
        
        # Process the data using QuantumDeviceTestbed
        testbed = QuantumDeviceTestbed()
        result = testbed.process_mobile_data(mobile_data, device_id)
        
        # Update device's last data timestamp
        connected_devices[device_id]['last_data'] = time.time()
        
        # Save result to Firebase if available
        try:
            save_testbed_result(result)
            logger.info("Mobile testbed result saved to Firebase")
        except Exception as e:
            logger.warning(f"Failed to save mobile result to Firebase: {str(e)}")
        
        logger.info(f"Mobile data processed successfully for device {device_id}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Mobile data processing error: {str(e)}", exc_info=True)
        return jsonify({
            'error': str(e),
            'status': 'error',
            'message': 'Failed to process mobile measurement data'
        }), 500

@app.route('/api/mobile_device_status', methods=['GET'])
def get_mobile_device_status():
    """Get status of all connected mobile devices"""
    try:
        current_time = time.time()
        device_statuses = []
        
        for device_id, device_data in connected_devices.items():
            # Consider device offline if no data received for 30 seconds
            is_active = (device_data.get('last_data') and 
                        current_time - device_data['last_data'] < 30)
            
            device_statuses.append({
                'device_id': device_id,
                'connected_at': device_data.get('connected_at', current_time),
                'last_data': device_data.get('last_data'),
                'is_active': is_active,
                'status': device_data.get('status', 'waiting'),
                'data_received': device_data.get('data_received', False),
                'result': device_data.get('result'),
                'info': device_data.get('info', {})
            })
        
        return jsonify({
            'status': 'success',
            'devices': device_statuses,
            'total_devices': len(connected_devices)
        })
        
    except Exception as e:
        logger.error(f"Device status error: {str(e)}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

@app.route('/api/simulate_mobile_data', methods=['POST'])
def simulate_mobile_data():
    """Simulate mobile device sending quantum measurement data (for testing)"""
    try:
        data = request.get_json()
        session_token = data.get('session_token')
        
        if not session_token or session_token not in connected_devices:
            return jsonify({
                'error': 'Invalid session token',
                'status': 'error'
            }), 401
        
        # Generate simulated quantum measurement data
        simulated_data = {
            'photon_detections': [f"photon_{i}" for i in range(50)],  # 50 photon detections
            'duration': 10.0,
            'device_info': {
                'model': 'Simulated Mobile Quantum Sensor',
                'version': '2.1.0'
            },
            'device_id': f'mobile_sim_{session_token[:8]}'
        }
        
        # Process the simulated data
        testbed = QuantumDeviceTestbed()
        result = testbed.analyze_mobile_data(simulated_data)
        
        # Update session with received data
        connected_devices[session_token].update({
            'last_data': time.time(),
            'status': 'data_received',
            'data_received': True,
            'result': result
        })
        
        logger.info(f"Simulated mobile data processed for session {session_token}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Simulated mobile data error: {str(e)}", exc_info=True)
        return jsonify({
            'error': str(e),
            'status': 'error',
            'message': 'Failed to process simulated mobile data'
        }), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'BB84 QKD Simulator is running',
        'version': '1.0.0'
    })
