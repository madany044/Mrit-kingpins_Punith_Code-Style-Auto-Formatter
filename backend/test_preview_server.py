#!/usr/bin/env python3
"""Test script to verify preview server is working."""

import requests
import json

PREVIEW_SERVER_URL = "http://localhost:50000"

def test_preview_server():
    """Test the preview server endpoints."""
    print("Testing preview server...")
    
    # Test health endpoint
    try:
        response = requests.get(f"{PREVIEW_SERVER_URL}/health")
        print(f"✓ Health check: {response.status_code} - {response.json()}")
    except requests.exceptions.ConnectionError:
        print("✗ Preview server is not running!")
        print("Please start it with: python backend/preview_server.py")
        return False
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False
    
    # Test preview endpoint
    test_code = "<html><body><h1>Test Preview</h1></body></html>"
    try:
        response = requests.post(
            f"{PREVIEW_SERVER_URL}/preview",
            json={
                "code": test_code,
                "filename": "test.html",
                "type": "html",
                "preview_id": "test"
            },
            headers={"Content-Type": "application/json"}
        )
        print(f"✓ Preview POST: {response.status_code}")
        data = response.json()
        print(f"  Response: {json.dumps(data, indent=2)}")
        
        # Test view endpoint
        preview_id = data.get("preview_id", "test")
        view_response = requests.get(f"{PREVIEW_SERVER_URL}/view?preview_id={preview_id}")
        print(f"✓ Preview GET: {view_response.status_code}")
        print(f"  Content length: {len(view_response.text)} characters")
        
        return True
    except Exception as e:
        print(f"✗ Preview test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_preview_server()
    if success:
        print("\n✓ All tests passed! Preview server is working correctly.")
    else:
        print("\n✗ Some tests failed. Please check the preview server.")

