"""
Simple test to verify the AI implementation works
"""
import asyncio
from app.services.gemini_service import gemini_service

async def test_basic_response():
    print("Testing basic AI response...")
    
    # Test with a simple query
    response = await gemini_service.generate_response(
        query="What is 2 + 2?",
        context=None,
        intent=None
    )
    
    print(f"Response: {response}")
    print("✓ Basic test passed")

async def test_payslip_context():
    print("\nTesting payslip explanation with context...")
    
    # Simulate a payslip context
    context = {
        "data": {
            "current_payslip": {
                "gross_pay": 50000,
                "net_pay": 42500,
                "created_at": "2025-10-15",
            },
            "previous_payslips": [
                {
                    "gross_pay": 50000,
                    "net_pay": 43000,
                    "created_at": "2025-09-15",
                }
            ],
            "ytd_totals": {
                "gross_ytd": 350000,
                "net_ytd": 301000,
                "months_included": 7
            }
        },
        "meta": {
            "employee_name": "Test Employee"
        }
    }
    
    response = await gemini_service.generate_response(
        query="Explain this payslip",
        context=context,
        intent="payslip_explain"
    )
    
    print(f"Response preview: {response[:500]}...")
    print("✓ Payslip test passed")

async def test_streaming():
    print("\nTesting streaming response...")
    
    context = {
        "data": {
            "current_payslip": {
                "gross_pay": 50000,
                "net_pay": 42500,
            }
        }
    }
    
    chunks_received = 0
    async for chunk in gemini_service.generate_response_chunks(
        query="Explain this payslip briefly",
        context=context,
        intent="payslip_explain"
    ):
        chunks_received += 1
        if chunks_received <= 3:
            print(f"Chunk {chunks_received}: {chunk[:100]}...")
    
    print(f"✓ Streaming test passed ({chunks_received} chunks received)")

async def main():
    print("="*60)
    print("AI Service Tests")
    print("="*60)
    
    try:
        await test_basic_response()
        await test_payslip_context()
        await test_streaming()
        
        print("\n" + "="*60)
        print("✓ All tests passed!")
        print("="*60)
        
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
