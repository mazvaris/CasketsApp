import { useForm, Controller } from 'react-hook-form';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const steps = ['Customer Details', 'Deceased Details', 'Coffin Selection', 'Additional Services', 'Summary'];

type FormData = {
  customerName: string;
  phone: string;
  email?: string;
  deceasedName: string;
  birthDate?: string;
  deathDate: string;
  gender: string;
  coffinType: string;
  model: string;
  services: {
    transport: boolean;
    flowers: boolean;
    mortuary: boolean;
    embalming: boolean;
  };
};

export default function CustomerCoffinForm() {
  const { register, handleSubmit, control } = useForm<FormData>({
    defaultValues: {
      services: {
        transport: false,
        flowers: false,
        mortuary: false,
        embalming: false,
      },
    },
  });
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);
  const [step, setStep] = useState(0);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

  const onSubmit = (data: FormData) => {
    setSubmittedData(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 max-w-2xl mx-auto">
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-bold">{steps[step]}</h2>

        {step === 0 && (
          <>
            <label className="block">
              <span className="text-sm font-medium">Full Name</span>
              <Input placeholder="Full Name" {...register('customerName')} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Phone Number</span>
              <Input type="tel" placeholder="Phone Number" {...register('phone')} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Email Address (optional)</span>
              <Input type="email" placeholder="Email Address (optional)" {...register('email')} />
            </label>
          </>
        )}

        {step === 1 && (
          <>
            <label className="block">
              <span className="text-sm font-medium">Full Name</span>
              <Input placeholder="Full Name" {...register('deceasedName')} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Date of Birth</span>
              <Input type="date" {...register('birthDate')} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Date of Death</span>
              <Input type="date" {...register('deathDate')} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Gender</span>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select {...field} onValueChange={field.onChange}>
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
            <label className="block">
              <span className="text-sm font-medium">Coffin or Casket</span>
              <Controller
                name="coffinType"
                control={control}
                render={({ field }) => (
                  <Select {...field} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Coffin or Casket" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Coffin">Coffin</SelectItem>
                      <SelectItem value="Casket">Casket</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Model</span>
              <Input placeholder="Model" {...register('model')} />
            </label>
          </>
        )}

        {step === 3 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {['transport', 'flowers', 'mortuary', 'embalming'].map((service) => (
                <label key={service} className="flex items-center space-x-2">
                  <Checkbox {...register(`services.${service}` as const)} />
                  <span className="capitalize">{service}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {step === 4 && submittedData && (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold">Summary</h3>
            <pre className="bg-gray-100 p-4 rounded mt-2 text-sm">
              {JSON.stringify(submittedData, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button type="button" onClick={prevStep} disabled={step === 0}>Back</Button>
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

