import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button'; // keep this if it exists
import type { Contact, ContactInput, ContactType } from '@/types/contact';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['CUSTOMER', 'VENDOR', 'BOTH']),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  mobile: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  profileImage: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  initialData?: Contact | null;
  onSubmit: (data: ContactInput) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: initialData || {
      name: '',
      type: 'CUSTOMER' as ContactType,
      email: '',
      mobile: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      profileImage: '',
    },
  });

  const typeValue = useWatch({ control, name: 'type' });

  const handleFormSubmit = (data: ContactFormData) => {
    onSubmit({
      name: data.name,
      type: data.type as ContactType,
      email: data.email || undefined,
      mobile: data.mobile || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      pincode: data.pincode || undefined,
      profileImage: data.profileImage || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium text-[#1a2332]">
          Name *
        </label>
        <input
          id="name"
          placeholder="Enter contact name"
          className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          {...register('name')}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="type" className="text-sm font-medium text-[#1a2332]">
          Type *
        </label>
        <select
          id="type"
          value={typeValue}
          onChange={(e) => setValue('type', e.target.value as ContactType)}
          className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
        >
          <option value="CUSTOMER">Customer</option>
          <option value="VENDOR">Vendor</option>
          <option value="BOTH">Both</option>
        </select>
        {errors.type && <p className="text-sm text-red-600">{errors.type.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-[#1a2332]">
            Email
          </label>
          <input
            id="email"
            placeholder="email@example.com"
            className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
            {...register('email')}
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="mobile" className="text-sm font-medium text-[#1a2332]">
            Mobile
          </label>
          <input
            id="mobile"
            placeholder="Enter mobile number"
            className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
            {...register('mobile')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="city" className="text-sm font-medium text-[#1a2332]">
            City
          </label>
          <input
            id="city"
            placeholder="City"
            className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
            {...register('city')}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="state" className="text-sm font-medium text-[#1a2332]">
            State
          </label>
          <input
            id="state"
            placeholder="State"
            className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
            {...register('state')}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pincode" className="text-sm font-medium text-[#1a2332]">
          Pincode
        </label>
        <input
          id="pincode"
          placeholder="Pincode"
          className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          {...register('pincode')}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="address" className="text-sm font-medium text-[#1a2332]">
          Address
        </label>
        <textarea
          id="address"
          placeholder="Full address"
          rows={3}
          className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          {...register('address')}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="profileImage" className="text-sm font-medium text-[#1a2332]">
          Profile Image URL (optional)
        </label>
        <input
          id="profileImage"
          placeholder="https://example.com/avatar.jpg"
          className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          {...register('profileImage')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[#e5e7eb]">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
          {isSubmitting
            ? 'Saving...'
            : initialData
            ? 'Save Changes'
            : 'Save Contact'}
        </Button>
      </div>
    </form>
  );
};
