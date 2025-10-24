"""
Test script for AI assistant endpoints
Run this after starting the backend server
"""

import requests
import json

BASE_URL = "http://localhost:8000"

# Test data
TEST_QUERIES = [
    {
        "name": "General Chat",
        "payload": {
            "query": "What is this system about?",
            "context": None,
            "intent": None
        }
    },
    {
        "name": "Leave Advice",
        "payload": {
            "query": "How many days will a leave from 2025-11-01 to 2025-11-05 take?",
            "context": {
                "page_view": "leave_request",
                "data": {
                    "start_date": "2025-11-01",
                    "end_date": "2025-11-05",
                    "leave_type": "paid"
                }
            },
            "intent": "leave_advice"
        }
    },
    {
        "name": "Payslip Explanation (No Context)",
        "payload": {
            "query": "Explain how to read a payslip",
            "context": {
                "page_view": "payslip"
            },
            "intent": "payslip_explain"
        }
    },
    {
        "name": "Tax Suggestions",
        "payload": {
            "query": "What are the common tax-saving options in India?",
            "context": {
                "page_view": "payslip",
                "data": {
                    "gross_pay": 50000,
                    "net_pay": 42000
                }
            },
            "intent": "payslip_tax_suggestions"
        }
    }
]


def test_endpoint(test_case, token=None):
    """Test a single endpoint"""
    print(f"\n{'='*60}")
    print(f"Test: {test_case['name']}")
    print(f"{'='*60}")
    
    headers = {
        "Content-Type": "application/json"
    }
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/chat/chat",
            headers=headers,
            json=test_case['payload'],
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response:\n{data.get('response', 'No response')[:500]}...")
            print(f"Context Used: {data.get('context_used', False)}")
            return True
        else:
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"Exception: {e}")
        return False


def main():
    print("AI Assistant Endpoint Tests")
    print("=" * 60)
    print("\nNote: Tests requiring authentication will fail without a token.")
    print("To test with auth, replace TOKEN variable with a valid session token.\n")
    
    # Replace with actual token for authenticated tests
    TOKEN = None  # Get from browser: Application > Cookies > sb-access-token
    
    results = []
    for test in TEST_QUERIES:
        success = test_endpoint(test, TOKEN)
        results.append((test['name'], success))
    
    print(f"\n{'='*60}")
    print("Test Summary")
    print(f"{'='*60}")
    for name, success in results:
        status = "✓ PASS" if success else "✗ FAIL"
        print(f"{status}: {name}")
    
    passed = sum(1 for _, s in results if s)
    total = len(results)
    print(f"\nTotal: {passed}/{total} tests passed")


if __name__ == "__main__":
    main()
