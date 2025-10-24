"""
Test script to verify backend auth and proxy endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    print("Health check:", response.json())
    assert response.status_code == 200

def test_login():
    """Test login endpoint"""
    # Use a test account - replace with actual credentials
    payload = {
        "email": "admin@test.com",
        "password": "password123"
    }
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json=payload,
        allow_redirects=False
    )
    print(f"Login response status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Login successful! CSRF token: {data.get('csrf_token')}")
        cookies = response.cookies
        print(f"Cookies set: {list(cookies.keys())}")
        return cookies, data.get('csrf_token')
    else:
        print(f"Login failed: {response.text}")
        return None, None

def test_proxy_with_session(cookies, csrf_token):
    """Test proxy endpoint with session"""
    if not cookies:
        print("Skipping proxy test - no session")
        return
    
    # Test getting current user profile
    payload = {
        "resource": "profiles",
        "action": "me"
    }
    response = requests.post(
        f"{BASE_URL}/api/v1/proxy/",
        json=payload,
        cookies=cookies
    )
    print(f"Proxy (profiles/me) status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Profile data: {json.dumps(data, indent=2)}")
    else:
        print(f"Proxy failed: {response.text}")

if __name__ == "__main__":
    print("Testing backend endpoints...\n")
    
    # Test health
    try:
        test_health()
        print("✓ Health check passed\n")
    except Exception as e:
        print(f"✗ Health check failed: {e}\n")
    
    # Test login
    try:
        cookies, csrf = test_login()
        if cookies:
            print("✓ Login passed\n")
            
            # Test proxy
            test_proxy_with_session(cookies, csrf)
            print("✓ Proxy test completed\n")
        else:
            print("✗ Login failed - skipping proxy test\n")
    except Exception as e:
        print(f"✗ Login/proxy test failed: {e}\n")
    
    print("\nTest script completed!")
