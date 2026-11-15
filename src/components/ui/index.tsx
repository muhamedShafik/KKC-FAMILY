import React from 'react';
import { cn } from '@/lib/utils';

// ── Button ────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  variant = 'primary', size = 'md', loading, className, children, disabled, ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 cursor-pointer',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        {
          'bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow-md': variant === 'primary',
          'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200': variant === 'secondary',
          'hover:bg-stone-100 text-stone-700': variant === 'ghost',
          'bg-red-500 hover:bg-red-600 text-white': variant === 'danger',
          'border border-stone-300 text-stone-700 bg-white hover:bg-white hover:text-stone-700 hover:border-stone-300': variant === 'outline',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
        },
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-stone-700">
          {label}
        </label>
      )}
      <input
        id={fieldId}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900',
          'placeholder:text-stone-400 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent',
          error ? 'border-red-400' : 'border-stone-300',
          className,
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-stone-500">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-stone-700">
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        rows={4}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 resize-y',
          'placeholder:text-stone-400 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent',
          error ? 'border-red-400' : 'border-stone-300',
          className,
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-stone-500">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className, id, ...props }: SelectProps) {
  const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-stone-700">
          {label}
        </label>
      )}
      <select
        id={fieldId}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900',
          'focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent',
          error ? 'border-red-400' : 'border-stone-300',
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'amber' | 'green' | 'red' | 'stone' | 'blue';
  className?: string;
}

export function Badge({ children, variant = 'amber', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      {
        'bg-amber-100 text-amber-800': variant === 'amber',
        'bg-green-100 text-green-800': variant === 'green',
        'bg-red-100 text-red-800': variant === 'red',
        'bg-stone-100 text-stone-700': variant === 'stone',
        'bg-blue-100 text-blue-800': variant === 'blue',
      },
      className,
    )}>
      {children}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, className, onClick }: {
  children: React.ReactNode; className?: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl shadow-sm border border-stone-100 p-6',
        onClick && 'cursor-pointer hover:shadow-md hover:border-amber-200 transition-all duration-200',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────
import { avatarColor, initials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const SIZES = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base', xl: 'w-20 h-20 text-lg', '2xl': 'w-28 h-28 text-2xl' };

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const bg = avatarColor(name);
  return (
    <div className={cn('rounded-full overflow-hidden flex items-center justify-center flex-shrink-0', SIZES[size], className)}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span
          className="w-full h-full flex items-center justify-center font-semibold text-white"
          style={{ background: bg }}
        >
          {initials(name)}
        </span>
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={cn('w-full bg-white rounded-2xl shadow-xl', widths[size])}>
                <div className="flex items-center justify-between p-6 border-b border-stone-100">
                  {title && (
                    <Dialog.Title className="text-lg font-semibold font-serif text-stone-900">
                      {title}
                    </Dialog.Title>
                  )}
                  <button
                    onClick={onClose}
                    className="ml-auto p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// ── Empty State ───────────────────────────────────────────────
export function EmptyState({
  icon: Icon, title, description, action
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-amber-400" />
        </div>
      )}
      <h3 className="font-serif text-xl font-semibold text-stone-800 mb-2">{title}</h3>
      {description && <p className="text-stone-500 text-sm max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} />;
}

// ── Section Header ────────────────────────────────────────────
export function SectionHeader({ title, subtitle, centered = false }: {
  title: string; subtitle?: string; centered?: boolean;
}) {
  return (
    <div className={cn('mb-10', centered && 'text-center')}>
      <h2 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 mb-3">{title}</h2>
      {subtitle && <p className="text-stone-500 text-lg max-w-2xl">{centered ? '' : ''}{subtitle}</p>}
      <div className={cn('mt-4 h-0.5 w-16 bg-amber-400', centered && 'mx-auto')} />
    </div>
  );
}

