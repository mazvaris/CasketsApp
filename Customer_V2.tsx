import { useForm, Controller } from 'react-hook-form'
import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const steps = ['Customer Details', 'Deceased Details'] as const

type FormData = {
  customerName: string
  phone: string
  email?: string
  deceasedName: string
  birthDate?: string
  deathDate: string
  gender: string
}

export default function CustomerCoffinForm() {
  const [step, setStep] = useState(0)

  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors },
    getValues,
    setError,
  } = useForm<FormData>({
    defaultValues: {
      customerName: '',
      phone: '',
      email: '',
      deceasedName: '',
      birthDate: '',
      deathDate: '',
      gender: '',
    },
    mode: 'onBlur',
  })

  const fieldsPerStep: Record<number, Array<keyof FormData>> = useMemo(
    () => ({
      0: ['customerName', 'phone', 'email'],
      1: ['deceasedName', 'birthDate', 'deathDate', 'gender'],
    }),
    []
  )

  async function nextStep() {
    const fields = fieldsPerStep[step]
    if (fields && fields.length) {
      const ok = await trigger(fields as any, { shouldFocus: true })
      if (!ok) return
    }

    if (step === 1) {
      const { birthDate, deathDate } = getValues()
      if (birthDate && deathDate && new Date(deathDate) < new Date(birthDate)) {
        setError('deathDate', { type: 'validate', message: 'Date of death cannot be before date of birth.' })
        return
      }
    }

    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 0))
  }

  const onSubmit = (data: FormData) => {
    if (data.birthDate && data.deathDate && new Date(data.deathDate) < new Date(data.birthDate)) {
      setError('deathDate', { type: 'validate', message: 'Date of death cannot be before date of birth.' })
      setStep(1)
      return
    }
    console.log('Form submitted:', data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 max-w-2xl mx-auto">
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-2">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  'h-2 w-8 rounded-full bg-muted',
                  i <= step && 'bg-primary'
                )}
                aria-hidden
              />
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold">{steps[step]}</h2>

        {step === 0 && (
          <div className="grid gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium">Full Name</span>
              <Input placeholder="Full Name" {...register('customerName', { required: 'Full name is required' })} />
              {errors.customerName && <p className="text-sm text-destructive">{errors.customerName.message}</p>}
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">Phone Number</span>
              <Input type="tel" placeholder="e.g. +263 77 123 4567" {...register('phone')} />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">Email Address (optional)</span>
              <Input type="email" placeholder="name@example.com" {...register('email')} />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium">Full Name</span>
              <Input placeholder="Full Name" {...register('deceasedName')} />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">Date of Birth</span>
              <Input type="date" {...register('birthDate')} />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">Date of Death</span>
              <Input type="date" {...register('deathDate')} />
            </label>

            <div className="grid gap-1">
              <span className="text-sm font-medium">Gender</span>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} onOpenChange={() => field.onBlur()}>
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
            </div>
          </div>
        )}

        <div className="flex justify-between pt-2">
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
  )
}

