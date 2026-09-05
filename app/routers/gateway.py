import razorpay
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from decimal import Decimal

from app.core.config import settings
from app.core.database import get_db
from app.models.domain import TransactionDocument, DocumentStatus, DocumentType
from app.models.accounting import JournalEntry, JournalItem, Account

router = APIRouter(prefix="/api/gateway", tags=["Payment Gateway"])

razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

class PaymentVerificationPayload(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    document_id: str

@router.post("/create-order/{document_id}")
async def create_razorpay_order(document_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TransactionDocument).where(TransactionDocument.id == document_id))
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        amount_in_paisa = int(float(document.total) * 100)
        order_data = {
            "amount": amount_in_paisa,
            "currency": "INR",
            "receipt": f"rcpt_{str(document.id)[:8]}",
            "notes": {"document_id": str(document.id)}
        }
        order = razorpay_client.order.create(data=order_data)
        
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": settings.RAZORPAY_KEY_ID,
            "document_id": str(document.id)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify-payment")
async def verify_razorpay_payment(payload: PaymentVerificationPayload, db: AsyncSession = Depends(get_db)):
    try:
        params_dict = {
            'razorpay_order_id': payload.razorpay_order_id,
            'razorpay_payment_id': payload.razorpay_payment_id,
            'razorpay_signature': payload.razorpay_signature
        }
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        result = await db.execute(select(TransactionDocument).where(TransactionDocument.id == payload.document_id))
        document = result.scalar_one_or_none()
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document.status = DocumentStatus.PAID
        
        # Link payment journal entry automatically
        accounts_query = await db.execute(select(Account).where(Account.code.in_(["1001", "1003"])))
        accounts = {acc.code: acc.id for acc in accounts_query.scalars().all()}
        
        if "1001" in accounts and "1003" in accounts:
            journal_entry = JournalEntry(
                date=document.date,
                reference=f"RZP-{payload.razorpay_payment_id[:8]}",
                narration="Online payment received via Razorpay"
            )
            db.add(journal_entry)
            await db.flush()

            db.add(JournalItem(entry_id=journal_entry.id, account_id=accounts["1001"], debit=document.total, credit=Decimal("0.00")))
            db.add(JournalItem(entry_id=journal_entry.id, account_id=accounts["1003"], debit=Decimal("0.00"), credit=document.total))

        await db.commit()
        
        return {
            "status": "success",
            "message": "Payment verified and ledger updated successfully!",
            "document_status": document.status
        }
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Payment signature verification failed!")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))