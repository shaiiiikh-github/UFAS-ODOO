# UFAS-ODOO

### Urban Furniture Accounting System

> A centralized business and accounting management platform designed to connect financial operations with everyday business workflows.

---

## 📌 Overview

**UFAS-ODOO (Urban Furniture Accounting System)** is a modern business and financial management platform developed to centralize the accounting and operational activities of Urban Furniture.

The system brings essential business processes together into a structured and connected workflow, reducing dependency on disconnected tools and improving visibility across financial and operational activities.

UFAS focuses on connecting:

* Accounting
* Sales
* Purchases
* Customers
* Vendors
* Products & Inventory
* Payments
* Journals
* Ledgers
* Budgets
* Financial Reports

The objective is to provide a **single source of truth** for business and financial information.

---

## 🎯 Project Objectives

The primary objectives of UFAS-ODOO are to:

* Centralize financial and operational information.
* Simplify accounting and transaction management.
* Connect sales and purchasing workflows with accounting.
* Maintain centralized customer and vendor information.
* Manage products and inventory efficiently.
* Provide structured payment and transaction workflows.
* Improve financial visibility through ledgers, budgets, and reports.
* Provide secure, role-based access to system functionality.
* Reduce repetitive manual data entry.
* Provide a scalable foundation for future business requirements.

---

## ✨ Key Features

### 🔐 Authentication & Access Control

* Secure user authentication
* Protected application routes
* Role-based access
* Controlled access to system functionality

### 📊 Dashboard

Provides a centralized overview of important business and financial information with quick access to major system modules.

### 💰 Accounting

The accounting module provides functionality for:

* Accounts
* Journals
* Transactions
* Ledgers
* Budgets
* Payments
* Financial reporting

### 🧾 Sales Management

Manage sales-related workflows including:

* Customers
* Products
* Quantities
* Pricing
* Sales transactions

### 🛒 Purchase Management

Manage purchase workflows involving:

* Vendors
* Products
* Purchase transactions
* Purchase-related information

### 👥 Customer & Vendor Management

Maintain centralized information for business relationships and connect them with relevant transactions.

### 📦 Product & Inventory Management

Manage products and related inventory information within the overall business workflow.

### 💳 Payment Management

Manage payment information and associate financial activity with relevant business transactions.

### 📒 Ledger & Financial Reporting

Transform individual transactions into meaningful financial information through:

* Ledgers
* Budgets
* Reports
* Financial summaries

---

## 🏗️ System Architecture

UFAS-ODOO follows a modular application architecture designed to keep the system maintainable and scalable.

```text
                    ┌──────────────────────┐
                    │      UFAS-ODOO       │
                    │ Urban Furniture      │
                    │ Accounting System    │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │     Authentication   │
                    │    & Access Control  │
                    └──────────┬───────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
       ┌─────▼─────┐     ┌────▼────┐      ┌────▼─────┐
       │ Accounting │     │  Sales  │      │ Purchases│
       └─────┬─────┘     └────┬────┘      └────┬─────┘
             │                │                 │
             └────────────────┼─────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Business Entities │
                    │ Customers/Vendors │
                    │ Products/Inventory│
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Payments & Reports│
                    │ Ledgers & Budgets │
                    └───────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Modern component-based architecture
* Reusable UI components
* Protected routes
* Structured service layer
* Typed data models

### Backend

* Python
* REST API architecture
* Authentication and authorization
* Business logic services

### Database

* PostgreSQL

### Development Tools

* Git
* GitHub
* VS Code
* npm
* Python virtual environment

---

## 📁 Project Structure

```text
UFAS-ODOO/
│
├── BackEnd/
│   ├── app/
│   ├── requirements.txt
│   ├── .env.example
│   └── ...
│
├── FrontBack/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── .gitignore
├── README.md
└── ...
```

> The exact internal structure may evolve as the application is extended.

---

## ⚙️ Getting Started

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Python 3.x
* PostgreSQL
* Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/shaiiiikh-github/UFAS-ODOO.git
cd UFAS-ODOO
```

---

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd BackEnd
```

Create and activate a Python virtual environment:

```bash
python -m venv venv
```

**Windows:**

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create your environment configuration using the provided example:

```bash
copy .env.example .env
```

Configure the required database and application variables inside `.env`.

Start the backend using the project's configured startup command.

---

### 3. Frontend Setup

Open a new terminal and navigate to:

```bash
cd FrontBack
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will then be available at the local development address shown in the terminal.

---

## 🔒 Environment Variables

Sensitive configuration values should **never be committed to GitHub**.

Use the provided environment example file:

```text
BackEnd/.env.example
```

Create a local `.env` file and configure the required values.

Typical configuration may include:

```env
DATABASE_URL=
SECRET_KEY=
API_URL=
```

> Never commit passwords, API keys, database credentials, or other secrets to the repository.

---

## 🔄 Core Workflow

The overall workflow of UFAS can be summarized as:

```text
Authentication
      ↓
Dashboard
      ↓
Master Data
      ↓
Sales / Purchases
      ↓
Transactions
      ↓
Payments
      ↓
Accounting
      ↓
Ledgers / Budgets
      ↓
Financial Reports
```

The objective is to maintain a connected flow of information throughout the organization.

---

## 🔐 Security & Maintainability

UFAS-ODOO is designed with several software engineering principles in mind:

* Authentication
* Protected routes
* Role-based access
* Modular architecture
* Reusable components
* Typed data structures
* Structured service layers
* Environment-based configuration
* Separation of frontend and backend responsibilities

These practices help create a foundation that can be maintained and extended as the project evolves.

---

## 📈 Future Improvements

Potential future enhancements include:

* Advanced financial analytics
* More detailed dashboards
* Automated financial summaries
* Advanced reporting and export functionality
* Notifications and alerts
* Enhanced inventory management
* Audit trails
* Additional role and permission controls
* Deployment and cloud infrastructure
* Automated testing and CI/CD

---

## 🎥 Project Demonstration

A complete project demonstration video showcases the major workflows and capabilities of UFAS-ODOO, including authentication, dashboard navigation, accounting, business operations, transactions, and reporting.

---

## 👨‍💻 Project

**UFAS-ODOO**
**Urban Furniture Accounting System**

Built to provide a centralized and connected approach to business and financial management.

---

## 📄 License

This project is developed as a project implementation for Urban Furniture Accounting System.

Add an appropriate open-source or project-specific license here if required.

---

## ⭐ Conclusion

UFAS-ODOO brings business operations and financial management together within a centralized platform.

By connecting accounting, sales, purchases, customers, vendors, products, payments, budgets, ledgers, and reporting, the system aims to provide:

**One Platform.**
**Connected Information.**
**Structured Workflows.**
**Better Financial Visibility.**
