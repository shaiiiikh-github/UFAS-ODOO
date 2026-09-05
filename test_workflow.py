import httpx

BASE_URL = "http://127.0.0.1:8000"

def run_test():
    with httpx.Client(base_url=BASE_URL) as client:
        print("1. Creating a test Customer...")
        contact_res = client.post("/api/contacts/", json={
            "name": "Test Furniture Buyer",
            "type": "Customer",
            "email": "buyer@test.com",
            "mobile": "1234567890",
            "city": "Chicago"
        })
        contact_id = contact_res.json()["id"]
        print(f"   -> Created Contact ID: {contact_id}")

        print("\n2. Creating a test Product...")
        product_res = client.post("/api/products/", json={
            "name": "Modern Wooden Table",
            "type": "Goods",
            "sales_price": 500.00,
            "cost": 300.00,
            "category": "Tables"
        })
        product_id = product_res.json()["id"]
        print(f"   -> Created Product ID: {product_id}")

        print("\n3. Generating a Customer Invoice (Total: $1,000.00)...")
        doc_res = client.post("/api/documents/", json={
            "contact_id": contact_id,
            "type": "Customer Invoice",
            "date": "2026-09-05",
            "lines": [
                {
                    "product_id": product_id,
                    "quantity": 2,
                    "unit_price": 500.00
                }
            ]
        })
        doc_id = doc_res.json()["id"]
        print(f"   -> Invoice Created with Status: {doc_res.json()['status']}")

        print("\n4. Confirming Document (Triggering Double-Entry Ledger Automation)...")
        confirm_res = client.post(f"/api/documents/{doc_id}/confirm")
        print(f"   -> Document Confirmed. Ledger Entry Linked.")

        print("\n5. Checking P&L Report (Should show $1,000 Income)...")
        pnl_before = client.get("/api/reports/pnl").json()
        print(f"   -> P&L Data: {pnl_before}")

        print("\n6. Registering a Payment of $1,000.00 (Moving money to Bank 'Bucket')...")
        payment_res = client.post("/api/payments/", json={
            "document_id": doc_id,
            "amount": 1000.00,
            "payment_method": "Bank"
        })
        print(f"   -> Payment Status: {payment_res.json()['message']}")

        print("\n7. Checking Final Balance Sheet & P&L Reports...")
        final_pnl = client.get("/api/reports/pnl").json()
        final_bs = client.get("/api/reports/balance-sheet").json()
        
        print("\n=== FINAL AUTOMATED REPORT RESULTS ===")
        print(f"Profit & Loss: {final_pnl}")
        print(f"Balance Sheet: {final_bs}")

if __name__ == "__main__":
    run_test()