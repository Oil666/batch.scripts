import requests
import json
import unittest
import os
import time
import sys

class BackendAPITest(unittest.TestCase):
    def setUp(self):
        # Get the backend URL from the frontend .env file
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    self.base_url = line.strip().split('=')[1].strip('"\'')
                    break
        
        self.api_url = f"{self.base_url}/api"
        print(f"Testing API at: {self.api_url}")
    
    def test_root_endpoint(self):
        """Test the root API endpoint"""
        try:
            print(f"\nTesting GET {self.api_url}/")
            response = requests.get(f"{self.api_url}/")
            print(f"Status code: {response.status_code}")
            print(f"Response: {response.text}")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data.get("message"), "Hello World")
            print("✅ Root endpoint test passed")
        except Exception as e:
            print(f"❌ Root endpoint test failed: {str(e)}")
            raise
    
    def test_status_endpoint_post(self):
        """Test creating a status check"""
        try:
            payload = {"client_name": "test_client"}
            print(f"\nTesting POST {self.api_url}/status")
            print(f"Payload: {payload}")
            
            response = requests.post(f"{self.api_url}/status", json=payload)
            print(f"Status code: {response.status_code}")
            print(f"Response: {response.text}")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data.get("client_name"), "test_client")
            self.assertIn("id", data)
            self.assertIn("timestamp", data)
            print("✅ Status POST endpoint test passed")
        except Exception as e:
            print(f"❌ Status POST endpoint test failed: {str(e)}")
            raise
    
    def test_status_endpoint_get(self):
        """Test getting status checks"""
        try:
            print(f"\nTesting GET {self.api_url}/status")
            response = requests.get(f"{self.api_url}/status")
            print(f"Status code: {response.status_code}")
            print(f"Response: {response.text[:200]}..." if len(response.text) > 200 else f"Response: {response.text}")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIsInstance(data, list)
            
            # If we have status checks, verify their structure
            if data:
                self.assertIn("id", data[0])
                self.assertIn("client_name", data[0])
                self.assertIn("timestamp", data[0])
                print(f"Found {len(data)} status checks in the database")
            else:
                print("No status checks found in the database")
            
            print("✅ Status GET endpoint test passed")
        except Exception as e:
            print(f"❌ Status GET endpoint test failed: {str(e)}")
            raise

if __name__ == "__main__":
    # Create a test suite
    suite = unittest.TestSuite()
    suite.addTest(BackendAPITest('test_root_endpoint'))
    suite.addTest(BackendAPITest('test_status_endpoint_post'))
    suite.addTest(BackendAPITest('test_status_endpoint_get'))
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n=== Backend API Test Summary ===")
    print(f"Tests run: {result.testsRun}")
    print(f"Errors: {len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    
    if not result.wasSuccessful():
        sys.exit(1)