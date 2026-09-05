import type { Contact, ContactInput, ContactFilters, ContactType } from '@/types/contact';
import { api } from '@/lib/api';

// ---- Mapping between backend and frontend shapes ----
// Backend: snake_case, enum values "Customer"/"Vendor"/"Both", uuid ids,
//          no `address` field, `is_active` + `profile_image_url`.
// Frontend: camelCase, enum 'CUSTOMER'/'VENDOR'/'BOTH', string ids.

interface BackendContact {
  id: string;
  name: string;
  type: 'Customer' | 'Vendor' | 'Both';
  email: string | null;
  mobile: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  profile_image_url: string | null;
  is_active: boolean;
}

const TYPE_TO_FRONTEND: Record<BackendContact['type'], ContactType> = {
  Customer: 'CUSTOMER',
  Vendor: 'VENDOR',
  Both: 'BOTH',
};

const TYPE_TO_BACKEND: Record<ContactType, BackendContact['type']> = {
  CUSTOMER: 'Customer',
  VENDOR: 'Vendor',
  BOTH: 'Both',
};

function toContact(c: BackendContact): Contact {
  return {
    id: c.id,
    name: c.name,
    type: TYPE_TO_FRONTEND[c.type],
    email: c.email ?? undefined,
    mobile: c.mobile ?? undefined,
    city: c.city ?? undefined,
    state: c.state ?? undefined,
    pincode: c.pincode ?? undefined,
    profileImage: c.profile_image_url ?? undefined,
    // NOTE: backend has no `address` field. It stays undefined round-trip.
  };
}

// Only send fields the backend accepts. `address` and `profileImage` are dropped
// on write (profile image has its own /profile-image endpoint).
function toBackendPayload(input: Partial<ContactInput>) {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.type !== undefined) payload.type = TYPE_TO_BACKEND[input.type];
  if (input.email !== undefined) payload.email = input.email || null;
  if (input.mobile !== undefined) payload.mobile = input.mobile || null;
  if (input.city !== undefined) payload.city = input.city || null;
  if (input.state !== undefined) payload.state = input.state || null;
  if (input.pincode !== undefined) payload.pincode = input.pincode || null;
  return payload;
}

export const contactService = {
  // Backend list endpoint has no search/type params, so filter client-side
  // to preserve the existing UI behavior.
  getContacts: async (filters?: ContactFilters): Promise<Contact[]> => {
    const raw = await api.get<BackendContact[]>('/api/contacts/');
    let result = raw.map(toContact);

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email?.toLowerCase().includes(q) ?? false) ||
          (c.mobile?.includes(q) ?? false),
      );
    }
    if (filters?.type && filters.type !== 'ALL') {
      result = result.filter((c) => c.type === filters.type);
    }
    return result;
  },

  // No single-contact endpoint on the backend; fetch the list and pick.
  getContact: async (id: string): Promise<Contact | undefined> => {
    const all = await contactService.getContacts();
    return all.find((c) => c.id === id);
  },

  createContact: async (input: ContactInput): Promise<Contact> => {
    const created = await api.post<BackendContact>('/api/contacts/', toBackendPayload(input));
    return toContact(created);
  },

  updateContact: async (id: string, input: Partial<ContactInput>): Promise<Contact> => {
    const updated = await api.put<BackendContact>(`/api/contacts/${id}`, toBackendPayload(input));
    return toContact(updated);
  },

  // Backend has no delete. Closest equivalent is archive (soft delete).
  deleteContact: async (id: string): Promise<void> => {
    await api.post<BackendContact>(`/api/contacts/${id}/archive`);
  },
};