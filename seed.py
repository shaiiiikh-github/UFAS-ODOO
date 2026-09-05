import asyncio
from app.core.database import AsyncSessionLocal, engine
from app.models.accounting import Account, AccountType

async def seed_chart_of_accounts():
    async with AsyncSessionLocal() as session:
        # Core Master Data for Urban Furniture as per the requirements
        accounts = [
            Account(code="1001", name="Cash", type=AccountType.ASSET),
            Account(code="1002", name="Bank", type=AccountType.ASSET),
            Account(code="1003", name="Debtors (Accounts Receivable)", type=AccountType.ASSET),
            Account(code="2001", name="Creditors (Accounts Payable)", type=AccountType.LIABILITY),
            Account(code="3001", name="Owner's Equity", type=AccountType.EQUITY),
            Account(code="4001", name="Sales Income", type=AccountType.INCOME),
            Account(code="5001", name="Purchases Expense", type=AccountType.EXPENSE),
        ]
        
        session.add_all(accounts)
        await session.commit()
        print("✅ Chart of Accounts seeded successfully!")

async def main():
    await seed_chart_of_accounts()
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())