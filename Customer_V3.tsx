import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const steps = ['Customer Details', 'Deceased Details', 'Coffin Selection', 'Additional Services', 'Summary'] as const;

export type FormData = {
  customerFirstName: string;
  customerLastName: string;
  phone: string;
  email?: string;
  // Deceased details — now all optional (no validation/required)
  deceasedFirstName?: string;
  deceasedLastName?: string;
  birthDate?: string;
  deathDate?: string;
  gender?: 'Male' | 'Female' | 'Other';
};

const schema = z.object({
  customerFirstName: z.string().min(1, 'First name is required'),
  customerLastName: z.string().min(1, 'Last name is required'),
  phone: z
    .string()
    .min(7, 'Enter a valid phone number')
    .regex(/^[0-9+ ()-]{7,}$/i, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  // Deceased details: no requirements/validation
  deceasedFirstName: z.string().optional(),
  deceasedLastName: z.string().optional(),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
});

export default function CustomerCoffinForm() {
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);
  const [step, setStep] = useState<number>(0);

  const { register, handleSubmit, control, trigger, formState: { errors }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {},
    mode: 'onTouched',
  });

  // Only validate Customer step; Deceased step has no validation now
  const stepFields: (keyof FormData)[][] = [
    ['customerFirstName', 'customerLastName', 'phone', 'email'],
    [], // Deceased Details — no validation
    [], // Coffin Selection - no fields
    [], // Additional Services - no fields
  ];

  const nextStep = async () => {
    if (step < steps.length - 2 && stepFields[step]?.length) {
      const valid = await trigger(stepFields[step] as any, { shouldFocus: true });
      if (!valid) return;
    }
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

  const onSubmit = (data: FormData) => {
    setSubmittedData(data);
    setStep(steps.length - 1);
  };

  const Summary = () => {
    const data = submittedData ?? (getValues() as FormData);
    return (
      <div className="mt-6 border-t pt-4 space-y-3">
        <div>
          <h4 className="font-semibold">Customer</h4>
          <p className="text-sm">{data.customerFirstName} {data.customerLastName}</p>
          <p className="text-sm">{data.phone}</p>
          {data.email && <p className="text-sm">{data.email}</p>}
        </div>
        <div>
          <h4 className="font-semibold">Deceased</h4>
          <p className="text-sm">{[data.deceasedFirstName, data.deceasedLastName].filter(Boolean).join(' ') || '—'}</p>
          <p className="text-sm">Birth: {data.birthDate || '—'}</p>
          <p className="text-sm">Death: {data.deathDate || '—'}</p>
          <p className="text-sm">Gender: {data.gender || '—'}</p>
        </div>
        {/* Coffin Selection intentionally omitted */}
        <div>
          <h4 className="font-semibold">Additional Services</h4>
          <p className="text-sm text-muted-foreground">Additional services coming soon — let us know any special requests during follow-up.</p>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 max-w-2xl mx-auto">
      {/* Progress / Stepper */}
      <div className="flex items-center justify-between">
        <div className="flex-1 h-2 bg-muted rounded-full mr-4">
          <div className="h-2 bg-primary rounded-full transition-all" style={{ width: `${(step / (steps.length - 1)) * 100}%` }} />
        </div>
        <span className="text-sm text-muted-foreground">Step {step + 1} of {steps.length}</span>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-bold">{steps[step]}</h2>

        {step === 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="text-sm font-medium">First Name</span>
                <Input placeholder="First Name" aria-invalid={!!errors.customerFirstName} {...register('customerFirstName')} />
                {errors.customerFirstName && <p className="text-xs text-destructive">{errors.customerFirstName.message}</p>}
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Last Name</span>
                <Input placeholder="Last Name" aria-invalid={!!errors.customerLastName} {...register('customerLastName')} />
                {errors.customerLastName && <p className="text-xs text-destructive">{errors.customerLastName.message}</p>}
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Phone Number</span>
              <Input type="tel" placeholder="Phone Number" aria-invalid={!!errors.phone} {...register('phone')} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Email Address (optional)</span>
              <Input type="email" placeholder="Email Address (optional)" aria-invalid={!!errors.email} {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </label>
          </>
        )}

        {step === 1 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="text-sm font-medium">First Name</span>
                <Input placeholder="First Name" {...register('deceasedFirstName')} />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Last Name</span>
                <Input placeholder="Last Name" {...register('deceasedLastName')} />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Date of Birth</span>
              <Input type="date" {...register('birthDate')} />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Date of Death</span>
              <Input type="date" {...register('deathDate')} />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Gender</span>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </label>
          </>
        )}

        {step === 2 && (
          <>
            {/* Coffin Selection: fields removed as requested */}
          </>
        )}

        {step === 3 && (
          <>
            {/* Additional Services: remove checkboxes and show message */}
            <p className="text-sm text-muted-foreground">Additional services coming soon — let us know any special requests during follow-up.</p>
          </>
        )}

        {step === 4 && (
          <div className="mt-2">
            <h3 className="text-lg font-semibold">Summary</h3>
            <Summary />
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button type="button" onClick={prevStep} disabled={step === 0} variant="secondary">
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button type="button" onClick={nextStep}>Next</Button>
          ) : (
            <Button type="submit">Submit</Button>
          )}
        </div>
      </Card>
    </form>
  );
}

