import asyncio
from app.core.database import AsyncSessionLocal
from app.models.accounting import Account, AccountType
from sqlalchemy import select

DEFAULT_ACCOUNTS = [
    {"code": "1001", "name": "Cash", "type": AccountType.ASSET},
    {"code": "1002", "name": "Bank", "type": AccountType.ASSET},
    {"code": "1003", "name": "Debtors (Accounts Receivable)", "type": AccountType.ASSET},
    {"code": "2001", "name": "Creditors (Accounts Payable)", "type": AccountType.LIABILITY},
    {"code": "3001", "name": "Owner's Equity", "type": AccountType.EQUITY},
    {"code": "4001", "name": "Sales Income", "type": AccountType.INCOME},
    {"code": "5001", "name": "Purchases Expense", "type": AccountType.EXPENSE},
]

async def seed_chart_of_accounts():
    async with AsyncSessionLocal() as session:
        for acc in DEFAULT_ACCOUNTS:
            res = await session.execute(select(Account).where(Account.code == acc["code"]))
            if not res.scalar_one_or_none():
                session.add(Account(**acc))
        await session.commit()
        print("✅ Chart of Accounts seeded successfully!")

async def main():
    await seed_chart_of_accounts()

if __name__ == "__main__":
    asyncio.run(main())