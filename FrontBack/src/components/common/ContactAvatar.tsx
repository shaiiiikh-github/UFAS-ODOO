import React from 'react';
import { cn } from '@/lib/utils';

interface ContactAvatarProps {
  name: string;
  imageUrl?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ContactAvatar: React.FC<ContactAvatarProps> = ({
  name,
  imageUrl,
  className,
  size = 'sm',
}) => {
  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn('rounded-full object-cover', sizeMap[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-[#eef2f6] flex items-center justify-center font-medium text-[#1a2a3a]',
        sizeMap[size],
        className
      )}
    >
      {initials}
    </div>
  );
};