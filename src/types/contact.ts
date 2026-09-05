export type ContactType = 'CUSTOMER' | 'VENDOR' | 'BOTH';

export interface Contact {
  id: string;
  name: string;
  type: ContactType;
  email?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  profileImage?: string; // URL or base64, but we'll just use string for now
  createdAt?: string;
  updatedAt?: string;
}

export type ContactInput = Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>;

export interface ContactFilters {
  search?: string;
  type?: ContactType | 'ALL';
}