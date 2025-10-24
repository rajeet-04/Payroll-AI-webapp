"""
Quick API test for the chat endpoints
Run this with the backend server running at http://localhost:8000

Note: This test requires a valid authentication token.
To get a token:
1. Log in to the frontend at http://localhost:3000
2. Open browser DevTools > Application > Cookies
3. Copy the value of 'sb-access-token' cookie
4. Set TOKEN variable below
"""

import requests
import json

BASE_URL = "http://localhost:8000"
TOKEN = None  # Replace with actual token from browser cookies

def test_general_chat():
    """Test general chat without authentication"""
    print("\n" + "="*60)
    print("TEST 1: General Chat (No Auth)")
    print("="*60)
    
    payload = {
        "query": "What are the common tax-saving options in India?",
        "context": None,
        "intent": None
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/chat/chat",
        headers={"Content-Type": "application/json"},
        json=payload,
        timeout=30
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Response preview: {data['response'][:200]}...")
        print(f"Context used: {data['context_used']}")
        print("✓ PASS")
        return True
    else:
        print(f"Error: {response.text}")
        print("✗ FAIL")
        return False


def test_payslip_explain_with_auth():
    """Test payslip explain with authentication (requires token)"""
    print("\n" + "="*60)
    print("TEST 2: Payslip Explain with Auth")
    print("="*60)
    
    if not TOKEN:
        print("⚠ SKIP: No authentication token provided")
        print("To run this test:")
        print("1. Log in to frontend at http://localhost:3000")
        print("2. Open DevTools > Application > Cookies")
        print("3. Copy 'sb-access-token' value")
        print("4. Set TOKEN variable in this script")
        return None
    
    payload = {
        "query": "Explain my latest payslip and compare with last 12 months",
        "context": {
            "page_view": "payslip"
        },
        "intent": "payslip_explain",
        "chat_history": []
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/chat/chat",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {TOKEN}"
        },
        json=payload,
        timeout=30
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Response preview: {data['response'][:300]}...")
        print(f"Context used: {data['context_used']}")
        print("✓ PASS")
        return True
    else:
        print(f"Error: {response.text}")
        print("✗ FAIL")
        return False


def test_streaming_endpoint():
    """Test streaming endpoint (requires token)"""
    print("\n" + "="*60)
    print("TEST 3: Streaming Endpoint")
    print("="*60)
    
    if not TOKEN:
        print("⚠ SKIP: No authentication token provided")
        return None
    
    payload = {
        "intent": "payslip_explain",
        "payslip_id": "dummy-uuid-for-test",  # Would need real payslip ID
        "query": "Explain this payslip briefly",
        "system_instruction": "Be concise and use INR formatting"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/chat/chat/stream",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {TOKEN}"
            },
            json=payload,
            stream=True,
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("Streaming response:")
            chunks_received = 0
            for line in response.iter_lines():
                if line:
                    decoded = line.decode('utf-8')
                    if decoded.startswith('data: '):
                        chunk_data = decoded[6:]  # Remove 'data: ' prefix
                        print(f"  Chunk {chunks_received}: {chunk_data[:80]}...")
                        chunks_received += 1
                        if chunks_received >= 5:  # Stop after 5 chunks for brevity
                            print(f"  ... (stopped after {chunks_received} chunks)")
                            break
            print("✓ PASS")
            return True
        else:
            print(f"Error: {response.text}")
            print("✗ FAIL")
            return False
    except Exception as e:
        print(f"Exception: {e}")
        print("✗ FAIL")
        return False


def main():
    print("="*60)
    print("AI ASSISTANT API TESTS")
    print("="*60)
    print(f"Backend URL: {BASE_URL}")
    print(f"Token provided: {'Yes' if TOKEN else 'No'}")
    
    results = []
    
    # Test 1: General chat (no auth)
    results.append(("General Chat", test_general_chat()))
    
    # Test 2: Payslip explain with auth
    results.append(("Payslip Explain", test_payslip_explain_with_auth()))
    
    # Test 3: Streaming
    results.append(("Streaming", test_streaming_endpoint()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    for name, result in results:
        if result is True:
            status = "✓ PASS"
        elif result is False:
            status = "✗ FAIL"
        else:
            status = "⚠ SKIP"
        print(f"{status}: {name}")
    
    passed = sum(1 for _, r in results if r is True)
    failed = sum(1 for _, r in results if r is False)
    skipped = sum(1 for _, r in results if r is None)
    total = len(results)
    
    print(f"\nTotal: {passed} passed, {failed} failed, {skipped} skipped (out of {total})")


if __name__ == "__main__":
    main()
