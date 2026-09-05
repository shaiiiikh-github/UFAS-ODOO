import type { Contact, ContactInput, ContactFilters } from '@/types/contact';

// Mock data – isolated for development
const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Rahul Kumar',
    type: 'CUSTOMER',
    email: 'rahul@modularinteriors.in',
    mobile: '9876543210',
    address: '123, MG Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
  },
  {
    id: '2',
    name: 'Priya Sharma',
    type: 'VENDOR',
    email: 'priya@timberworld.com',
    mobile: '8765432109',
    address: '45, Industrial Area',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
  },
  {
    id: '3',
    name: 'Arjun Mehta',
    type: 'BOTH',
    email: 'arjun@heritagefurniture.in',
    mobile: '7654321098',
    address: '78, BKC',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400051',
  },
  {
    id: '4',
    name: 'Sneha Patel',
    type: 'CUSTOMER',
    email: 'sneha@elitedesigns.com',
    mobile: '6543210987',
    address: '12, Residency Road',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001',
  },
  {
    id: '5',
    name: 'Vikram Singh',
    type: 'VENDOR',
    email: 'vikram@hardwaresupplies.in',
    mobile: '5432109876',
    address: '55, Industrial Estate',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
  },
  {
    id: '6',
    name: 'Anita Desai',
    type: 'BOTH',
    email: 'anita@artisanfurniture.com',
    mobile: '4321098765',
    address: '90, JP Nagar',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560078',
  },
];

let contacts = [...mockContacts];
let nextId = contacts.length + 1;

// Simulate async delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const contactService = {
  // Fetch contacts with optional filters (search, type)
  getContacts: async (filters?: ContactFilters): Promise<Contact[]> => {
    await delay(500);
    let result = [...contacts];

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          (c.email && c.email.toLowerCase().includes(searchLower)) ||
          (c.mobile && c.mobile.includes(searchLower))
      );
    }

    if (filters?.type && filters.type !== 'ALL') {
      result = result.filter((c) => c.type === filters.type);
    }

    return result;
  },

  // Get a single contact by ID
  getContact: async (id: string): Promise<Contact | undefined> => {
    await delay(300);
    return contacts.find((c) => c.id === id);
  },

  // Create a new contact
  createContact: async (input: ContactInput): Promise<Contact> => {
    await delay(600);
    const newContact: Contact = {
      ...input,
      id: String(nextId++),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    contacts.push(newContact);
    return newContact;
  },

  // Update an existing contact
  updateContact: async (id: string, input: Partial<ContactInput>): Promise<Contact> => {
    await delay(600);
    const index = contacts.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Contact not found');
    const updated = { ...contacts[index], ...input, updatedAt: new Date().toISOString() };
    contacts[index] = updated;
    return updated;
  },

  // Delete (archive) – we'll just remove for mock
  deleteContact: async (id: string): Promise<void> => {
    await delay(400);
    contacts = contacts.filter((c) => c.id !== id);
  },
};