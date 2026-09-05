import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: { common: { search: 'Search…', profile: 'Profile', settings: 'Settings', logout: 'Logout', notifications: 'Notifications' }, navigation: { dashboard: 'Dashboard', masterData: 'Master Data', contacts: 'Contacts', products: 'Products', accounts: 'Chart of Accounts', journals: 'Journals', analytics: 'Analytic Accounts', budgets: 'Budgets', sales: 'Sales', salesOrders: 'Sales Orders', customerInvoices: 'Customer Invoices', customerPayments: 'Customer Payments', purchases: 'Purchases', purchaseOrders: 'Purchase Orders', vendorBills: 'Vendor Bills', vendorPayments: 'Vendor Payments', accounting: 'Accounting', journalEntries: 'Journal Entries', ledgers: 'Ledgers', reports: 'Reports', profitLoss: 'Profit & Loss', balanceSheet: 'Balance Sheet', budgetReport: 'Budget Report', help: 'Help' }, auth: { administrator: 'Administrator' } },
  hi: { common: { search: 'खोजें…', profile: 'प्रोफ़ाइल', settings: 'सेटिंग्स', logout: 'लॉग आउट', notifications: 'सूचनाएँ' }, navigation: { dashboard: 'डैशबोर्ड', masterData: 'मास्टर डेटा', contacts: 'संपर्क', products: 'उत्पाद', accounts: 'खातों की सूची', journals: 'जर्नल', analytics: 'विश्लेषण खाते', budgets: 'बजट', sales: 'बिक्री', salesOrders: 'बिक्री आदेश', customerInvoices: 'ग्राहक चालान', customerPayments: 'ग्राहक भुगतान', purchases: 'खरीद', purchaseOrders: 'खरीद आदेश', vendorBills: 'विक्रेता बिल', vendorPayments: 'विक्रेता भुगतान', accounting: 'लेखांकन', journalEntries: 'जर्नल प्रविष्टियाँ', ledgers: 'खाते', reports: 'रिपोर्ट', profitLoss: 'लाभ और हानि', balanceSheet: 'बैलेंस शीट', budgetReport: 'बजट रिपोर्ट', help: 'सहायता' }, auth: { administrator: 'प्रशासक' } },
};

i18n.use(initReactI18next).init({ resources, lng: localStorage.getItem('ufas-language') || 'en', fallbackLng: 'en', defaultNS: 'common', ns: ['common', 'navigation', 'auth'], interpolation: { escapeValue: false } });
export default i18n;
