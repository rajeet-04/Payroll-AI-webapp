"""
Quick test to verify the implementation
"""
import asyncio
from app.services.gemini_service import gemini_service

async def test_gemini_service():
    print("Testing GeminiService...")
    print(f"Model initialized: {gemini_service.model}")
    print(f"Generation config: {gemini_service.generation_config}")
    
    # Test sanitization and masking
    test_context = {
        "data": {
            "employee_name": "Test User",
            "email": "test@example.com",
            "phone": "+919876543210",
            "bank_account": "1234567890",
            "pan": "ABCDE1234F",
            "gross_pay": 50000,
            "net_pay": 42000
        }
    }
    
    sanitized = gemini_service.sanitize_and_mask_context(test_context)
    print("\nSanitization test:")
    print(f"Original: {test_context}")
    print(f"Sanitized: {sanitized}")
    
    # Check that sensitive fields are removed
    assert "bank_account" not in str(sanitized), "Bank account should be removed"
    assert "pan" not in str(sanitized), "PAN should be removed"
    
    # Check that emails/phones are masked (should contain *** for masking)
    if "email" in sanitized.get("data", {}):
        email_val = sanitized["data"]["email"]
        assert "***" in email_val, f"Email should be masked with ***: {email_val}"
        print(f"  Email masked: {email_val}")
    
    if "phone" in sanitized.get("data", {}):
        phone_val = sanitized["data"]["phone"]
        assert "****" in phone_val, f"Phone should be masked with ****: {phone_val}"
        print(f"  Phone masked: {phone_val}")
    
    print("\n✓ All tests passed!")

if __name__ == "__main__":
    asyncio.run(test_gemini_service())
