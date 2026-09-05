import asyncio
from decimal import Decimal

from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine
from app.core.security import hash_password
from app.models.accounting import Account, AccountType, Journal, AnalyticAccount, AnalyticType
from app.models.auth import User, UserRole
from app.models.domain import Contact, ContactType, Product, ProductType


async def seed_data():
    async with AsyncSessionLocal() as db:
        print("Seeding database...")

        # Idempotent master-data seeding: safe to run more than once.
        account_specs = [
            ("1001", "Cash", AccountType.ASSET),
            ("1002", "Bank", AccountType.ASSET),
            ("1003", "Debtors", AccountType.ASSET),
            ("1004", "Input Tax Credit", AccountType.ASSET),
            ("2001", "Creditors", AccountType.LIABILITY),
            ("2101", "Tax Payable / Tax Control", AccountType.LIABILITY),
            ("3001", "Capital", AccountType.EQUITY),
            ("4001", "Sale Income", AccountType.INCOME),
            ("5001", "Purchase Expense", AccountType.EXPENSE),
        ]
        accounts_by_code = {}
        for code, name, account_type in account_specs:
            account = await db.scalar(select(Account).where(Account.code == code))
            if not account:
                account = Account(code=code, name=name, type=account_type)
                db.add(account)
                await db.flush()
            accounts_by_code[code] = account

        journal_specs = [
            ("Customer Invoices", "Sales", None),
            ("Vendor Bills", "Purchase", None),
            ("Main Bank", "Bank", accounts_by_code["1002"].id),
            ("Razorpay", "Bank", accounts_by_code["1002"].id),
            ("Petty Cash", "Cash", accounts_by_code["1001"].id),
        ]
        for name, journal_type, default_account_id in journal_specs:
            journal = await db.scalar(select(Journal).where(Journal.name == name))
            if not journal:
                db.add(Journal(name=name, type=journal_type, default_account_id=default_account_id))
            elif default_account_id and journal.default_account_id != default_account_id:
                journal.default_account_id = default_account_id

        analytic = await db.scalar(
            select(AnalyticAccount).where(AnalyticAccount.name == "Furniture Operations")
        )
        if not analytic:
            analytic = AnalyticAccount(name="Furniture Operations", type=AnalyticType.EXPENSE)
            db.add(analytic)
            await db.flush()

        # Demo master data used by the hackathon flow.
        vendor = await db.scalar(select(Contact).where(Contact.name == "Azure Furniture"))
        if not vendor:
            db.add(Contact(name="Azure Furniture", type=ContactType.VENDOR, city="Ahmedabad", state="Gujarat", pincode="380001"))
        customer = await db.scalar(select(Contact).where(Contact.name == "Nimesh Pathak"))
        if not customer:
            db.add(Contact(name="Nimesh Pathak", type=ContactType.CUSTOMER, city="Ahmedabad", state="Gujarat", pincode="380001"))
        product = await db.scalar(select(Product).where(Product.name == "Office Chair"))
        if not product:
            db.add(Product(name="Office Chair", type=ProductType.GOODS, sales_price=Decimal("6000.00"), cost=Decimal("4000.00"), category="Chairs", stock_quantity=0))

        await db.flush()

        # Bootstrap login accounts. Change these passwords immediately in any real deployment.
        admin = await db.scalar(select(User).where(User.email == "admin@urbanfurniture.test"))
        if not admin:
            db.add(User(
                name="Business Owner",
                email="admin@urbanfurniture.test",
                hashed_password=hash_password("Admin@12345"),
                role=UserRole.ADMIN,
            ))

        accountant = await db.scalar(select(User).where(User.email == "accountant@urbanfurniture.test"))
        if not accountant:
            db.add(User(
                name="Accountant",
                email="accountant@urbanfurniture.test",
                hashed_password=hash_password("Accountant@12345"),
                role=UserRole.ACCOUNTANT,
            ))

        # Demo Contact portal login, linked to the Nimesh Pathak customer contact created above.
        customer = await db.scalar(select(Contact).where(Contact.name == "Nimesh Pathak"))
        if customer:
            portal_user = await db.scalar(select(User).where(User.email == "nimesh@example.com"))
            if not portal_user:
                db.add(User(
                    name="Nimesh Pathak",
                    email="nimesh@example.com",
                    hashed_password=hash_password("Nimesh@12345"),
                    role=UserRole.CONTACT,
                    contact_id=customer.id,
                ))

        await db.commit()
        print("Chart of Accounts, journals, analytic account and demo master data are ready.")
        print("Login accounts:")
        print("  Admin:      admin@urbanfurniture.test / Admin@12345")
        print("  Accountant: accountant@urbanfurniture.test / Accountant@12345")
        print("  Contact:    nimesh@example.com / Nimesh@12345 (portal view for Nimesh Pathak)")


async def main():
    await seed_data()
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())