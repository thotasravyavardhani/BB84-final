# BB84 QKD Professional Simulator & Testbed

## Overview

This is a professional-grade web application that simulates the BB84 Quantum Key Distribution (QKD) protocol and serves as a virtual testbed for evaluating quantum device performance. The application provides both classical and quantum simulation capabilities, with real-time visualization of quantum channel communications, parameter testing, and security analysis. It's designed as a research tool for studying quantum cryptography protocols and testing quantum hardware integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Single-page application** built with vanilla JavaScript, HTML5, and Tailwind CSS
- **Canvas-based visualization engine** for real-time quantum channel animations and photon transmission
- **Responsive design** with professional research-grade UI components
- **Real-time logging system** for simulation feedback and device connectivity status
- **Chart.js integration** for displaying QBER metrics, key generation rates, and security parameters

### Backend Architecture
- **Flask web framework** (Python) with CORS enabled for API communication
- **Modular route system** separating simulation logic from web serving
- **BB84 protocol implementation** with support for manual and automatic qubit generation
- **Quantum device integration layer** for connecting to IBM Quantum hardware
- **Classical simulation fallback** when quantum hardware is unavailable

### Quantum Computing Integration
- **Qiskit runtime service** integration for accessing IBM Quantum devices
- **AerSimulator support** for local quantum circuit simulation
- **SamplerV2 primitives** for quantum random number generation
- **Graceful degradation** to classical simulation when Qiskit is unavailable

### Security and Protocol Features
- **BB84 protocol simulation** with configurable parameters (distance, noise, photon rates)
- **Eve attack modeling** including intercept-resend attacks
- **QBER threshold monitoring** (11% security threshold)
- **Error correction algorithms** (Cascade protocol)
- **Privacy amplification** techniques for final key generation

### Data Management
- **Firebase Firestore integration** for storing testbed results and simulation data
- **Environment-based configuration** for API keys and service credentials
- **In-memory logging system** for real-time simulation feedback
- **JSON-based API communication** between frontend and backend

## External Dependencies

### Quantum Computing Services
- **IBM Quantum API** - Access to real quantum hardware for true quantum random number generation
- **Qiskit Runtime Service** - Quantum circuit execution and sampling primitives
- **Qiskit Aer** - Local quantum simulator for fallback scenarios

### Cloud Services
- **Firebase Firestore** - NoSQL database for storing simulation results and testbed data
- **Firebase Authentication** - User authentication and session management

### Frontend Libraries
- **Tailwind CSS** - Utility-first CSS framework for responsive design
- **Chart.js** - Data visualization library for metrics and performance graphs
- **Feather Icons** - Icon library for UI components

### Python Backend Dependencies
- **Flask** - Web framework for API endpoints and template serving
- **Flask-CORS** - Cross-origin resource sharing for frontend-backend communication
- **NumPy** - Numerical computing for quantum state calculations
- **Qiskit ecosystem** - Quantum computing framework and IBM hardware integration

### Development Tools
- **Environment variables** - Configuration management for API keys and service credentials
- **Logging system** - Debug and info logging for development and monitoring
- **Error handling** - Graceful fallbacks for missing dependencies or service failures