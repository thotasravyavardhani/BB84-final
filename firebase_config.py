import os
import logging
from typing import Dict, List, Any
import json
import time

logger = logging.getLogger(__name__)

# Global variables for Firebase configuration (as mentioned in requirements)
try:
    __app_id = os.environ.get('FIREBASE_APP_ID', 'bb84-qkd-simulator')
    __firebase_config = {
        'apiKey': os.environ.get('FIREBASE_API_KEY', ''),
        'authDomain': os.environ.get('FIREBASE_AUTH_DOMAIN', ''),
        'projectId': os.environ.get('FIREBASE_PROJECT_ID', ''),
        'storageBucket': os.environ.get('FIREBASE_STORAGE_BUCKET', ''),
        'messagingSenderId': os.environ.get('FIREBASE_MESSAGING_SENDER_ID', ''),
        'appId': __app_id
    }
    __initial_auth_token = os.environ.get('FIREBASE_AUTH_TOKEN', '')
    
    # Try to initialize Firebase Admin SDK
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        # Initialize Firebase Admin SDK
        if not firebase_admin._apps:
            # Use service account key from environment or skip initialization
            service_account_key = os.environ.get('FIREBASE_SERVICE_ACCOUNT_KEY')
            if service_account_key:
                cred_dict = json.loads(service_account_key)
                cred = credentials.Certificate(cred_dict)
            else:
                # Skip Firebase initialization if no credentials provided
                raise Exception("No Firebase credentials provided - running in local mode")
            
            firebase_admin.initialize_app(cred)
        
        # Get Firestore client
        db = firestore.client()
        FIREBASE_AVAILABLE = True
        logger.info("Firebase Firestore initialized successfully")
        
    except Exception as e:
        logger.warning(f"Firebase initialization failed: {str(e)}")
        FIREBASE_AVAILABLE = False
        db = None

except Exception as e:
    logger.warning(f"Firebase configuration error: {str(e)}")
    FIREBASE_AVAILABLE = False
    db = None

def save_testbed_result(result: Dict[str, Any]) -> bool:
    """Save testbed result to Firestore"""
    if not FIREBASE_AVAILABLE or db is None:
        logger.warning("Firebase not available, result not saved")
        return False
    
    try:
        # Prepare document data
        doc_data = {
            'timestamp': time.time(),
            'created_at': firestore.SERVER_TIMESTAMP,
            'device_info': result.get('device_info', {}),
            'metrics': result.get('metrics', {}),
            'analysis': result.get('analysis', {}),
            'is_secure': result.get('is_secure', False),
            'user_id': 'anonymous'  # In a real app, this would be the authenticated user
        }
        
        # Add to Firestore
        doc_ref = db.collection('testbed_results').add(doc_data)
        logger.info(f"Testbed result saved to Firestore with ID: {doc_ref[1].id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to save testbed result: {str(e)}")
        return False

def get_testbed_results(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieve testbed results from Firestore"""
    if not FIREBASE_AVAILABLE or db is None:
        logger.warning("Firebase not available, returning empty results")
        return []
    
    try:
        # Query recent results
        results_ref = db.collection('testbed_results').order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit)
        docs = results_ref.stream()
        
        results = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            results.append(data)
        
        logger.info(f"Retrieved {len(results)} testbed results from Firestore")
        return results
        
    except Exception as e:
        logger.error(f"Failed to retrieve testbed results: {str(e)}")
        return []

def save_simulation_config(config: Dict[str, Any]) -> bool:
    """Save simulation configuration to Firestore"""
    if not FIREBASE_AVAILABLE or db is None:
        logger.warning("Firebase not available, configuration not saved")
        return False
    
    try:
        doc_data = {
            'timestamp': time.time(),
            'created_at': firestore.SERVER_TIMESTAMP,
            'config': config,
            'user_id': 'anonymous'
        }
        
        doc_ref = db.collection('simulation_configs').add(doc_data)
        logger.info(f"Simulation config saved to Firestore with ID: {doc_ref[1].id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to save simulation config: {str(e)}")
        return False

def get_simulation_configs(limit: int = 20) -> List[Dict[str, Any]]:
    """Retrieve simulation configurations from Firestore"""
    if not FIREBASE_AVAILABLE or db is None:
        logger.warning("Firebase not available, returning empty configs")
        return []
    
    try:
        configs_ref = db.collection('simulation_configs').order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit)
        docs = configs_ref.stream()
        
        configs = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            configs.append(data)
        
        logger.info(f"Retrieved {len(configs)} simulation configs from Firestore")
        return configs
        
    except Exception as e:
        logger.error(f"Failed to retrieve simulation configs: {str(e)}")
        return []
