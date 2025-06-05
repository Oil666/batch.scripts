import requests
import json
import unittest
import os
import time

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
        response = requests.get(f"{self.api_url}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("message"), "Hello World")
    
    def test_status_endpoint_post(self):
        """Test creating a status check"""
        payload = {"client_name": "test_client"}
        response = requests.post(f"{self.api_url}/status", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("client_name"), "test_client")
        self.assertIn("id", data)
        self.assertIn("timestamp", data)
    
    def test_status_endpoint_get(self):
        """Test getting status checks"""
        response = requests.get(f"{self.api_url}/status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        
        # If we have status checks, verify their structure
        if data:
            self.assertIn("id", data[0])
            self.assertIn("client_name", data[0])
            self.assertIn("timestamp", data[0])

if __name__ == "__main__":
    unittest.main()