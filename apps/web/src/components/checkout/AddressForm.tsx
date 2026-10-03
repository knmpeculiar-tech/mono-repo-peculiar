"use client";

import { Input } from "@/components/ui/Input";

export interface AddressFormValues {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
}

export const EMPTY_ADDRESS_FORM_VALUES: AddressFormValues = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
};

interface AddressFormProps {
  values: AddressFormValues;
  errors: Partial<Record<keyof AddressFormValues, string>>;
  onChange: (field: keyof AddressFormValues, value: string) => void;
}

export function AddressForm({ values, errors, onChange }: AddressFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Full name" error={errors.customerName}>
        <Input
          value={values.customerName}
          onChange={(e) => onChange("customerName", e.target.value)}
          autoComplete="name"
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email (optional)" error={errors.customerEmail}>
          <Input
            type="email"
            value={values.customerEmail}
            onChange={(e) => onChange("customerEmail", e.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field label="Phone" error={errors.customerPhone}>
          <Input
            type="tel"
            value={values.customerPhone}
            onChange={(e) => onChange("customerPhone", e.target.value)}
            autoComplete="tel"
            required
          />
        </Field>
      </div>
      <Field label="Address line 1" error={errors.line1}>
        <Input
          value={values.line1}
          onChange={(e) => onChange("line1", e.target.value)}
          autoComplete="address-line1"
          required
        />
      </Field>
      <Field label="Address line 2 (optional)" error={errors.line2}>
        <Input
          value={values.line2}
          onChange={(e) => onChange("line2", e.target.value)}
          autoComplete="address-line2"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City" error={errors.city}>
          <Input
            value={values.city}
            onChange={(e) => onChange("city", e.target.value)}
            autoComplete="address-level2"
            required
          />
        </Field>
        <Field label="State" error={errors.state}>
          <Input
            value={values.state}
            onChange={(e) => onChange("state", e.target.value)}
            autoComplete="address-level1"
            required
          />
        </Field>
        <Field label="Postal code" error={errors.postalCode}>
          <Input
            value={values.postalCode}
            onChange={(e) => onChange("postalCode", e.target.value)}
            autoComplete="postal-code"
            required
          />
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-caption">{label}</span>
      {children}
      {error ? <span className="text-danger text-xs">{error}</span> : null}
    </label>
  );
}
