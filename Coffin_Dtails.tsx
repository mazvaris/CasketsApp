import React from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronsUpDown, Check, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types & Validation ---
const schema = z.object({
  type: z.string().min(1, "Type is required"),
  typeOther: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  price: z
    .preprocess((v) => (v === "" ? undefined : Number(v)), z.number().positive("Price must be > 0"))
    .refine((v) => v !== undefined, "Price is required"),
  material: z.string().min(1, "Material is required"),
  materialOther: z.string().optional(),
  exteriorFinish: z.string().min(1, "Exterior Finish is required"),
  colour: z.string().min(1, "Colour is required"),
  colourOther: z.string().optional(),
  interiorFinish: z.string().min(1, "Interior Finish is required"),
  interiorFinishOther: z.string().optional(),
  hardware: z.array(z.string()).min(0).default([]),
});

type FormValues = z.infer<typeof schema>;

const TYPE_OPTIONS = [
  "Ordinary Fish",
  "1 Tier",
  "2 Tier",
  "3 Tier",
  "Cheap Dome",
  "Solid Dome",
  "Other",
] as const;

const MATERIAL_OPTIONS = [
  "Zimtex",
  "Superwood",
  "Zimtex/Superwood Mix",
  "Other",
] as const;

const EXTERIOR_FINISH_OPTIONS = ["Gloss Painted"] as const;

const COLOUR_OPTIONS = ["White", "Brown", "Lemonade", "Other"] as const;

const INTERIOR_FINISH_OPTIONS = ["Polyester", "Other"] as const;

const HARDWARE_OPTIONS = [
  "4 Gold Plated Handles",
  "Drop Handles",
] as const;

export default function CasketForm() {
  const [successOpen, setSuccessOpen] = React.useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "",
      typeOther: "",
      name: "",
      price: undefined as unknown as number,
      material: "",
      materialOther: "",
      exteriorFinish: "Gloss Painted",
      colour: "",
      colourOther: "",
      interiorFinish: "",
      interiorFinishOther: "",
      hardware: [],
    },
  });

  const selectedType = watch("type");
  const selectedMaterial = watch("material");
  const selectedColour = watch("colour");
  const selectedInterior = watch("interiorFinish");

  const onSubmit = async (values: FormValues) => {
    // Replace this with your actual persistence call
    // e.g., await fetch('/api/caskets', { method: 'POST', body: JSON.stringify(values) })
    // Simulate a short delay
    await new Promise((resolve) => setTimeout(resolve, 400));
    setSuccessOpen(true);
    reset();
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Casket / Coffin Details</h1>
        <p className="text-sm text-muted-foreground">Record details of a casket/coffin.</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && (
            <p className="text-sm text-destructive">{errors.type.message}</p>
          )}
          {selectedType === "Other" && (
            <div className="pt-2">
              <Label htmlFor="typeOther">Specify Type</Label>
              <Input id="typeOther" placeholder="Enter type" {...register("typeOther")} />
            </div>
          )}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="e.g., Classic Dome" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input id="price" type="number" step="0.01" placeholder="0.00" {...register("price")} />
          {errors.price && (
            <p className="text-sm text-destructive">{errors.price.message}</p>
          )}
        </div>

        {/* Material */}
        <div className="space-y-2">
          <Label htmlFor="material">Material</Label>
          <Controller
            name="material"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="material">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.material && (
            <p className="text-sm text-destructive">{errors.material.message}</p>
          )}
          {selectedMaterial === "Other" && (
            <div className="pt-2">
              <Label htmlFor="materialOther">Specify Material</Label>
              <Input id="materialOther" placeholder="Enter material" {...register("materialOther")} />
            </div>
          )}
        </div>

        {/* Exterior Finish */}
        <div className="space-y-2">
          <Label htmlFor="exteriorFinish">Exterior Finish</Label>
          <Controller
            name="exteriorFinish"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="exteriorFinish">
                  <SelectValue placeholder="Select exterior finish" />
                </SelectTrigger>
                <SelectContent>
                  {EXTERIOR_FINISH_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.exteriorFinish && (
            <p className="text-sm text-destructive">{errors.exteriorFinish.message}</p>
          )}
        </div>

        {/* Colour */}
        <div className="space-y-2">
          <Label htmlFor="colour">Colour</Label>
          <Controller
            name="colour"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="colour">
                  <SelectValue placeholder="Select colour" />
                </SelectTrigger>
                <SelectContent>
                  {COLOUR_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.colour && (
            <p className="text-sm text-destructive">{errors.colour.message}</p>
          )}
          {selectedColour === "Other" && (
            <div className="pt-2">
              <Label htmlFor="colourOther">Specify Colour</Label>
              <Input id="colourOther" placeholder="Enter colour" {...register("colourOther")} />
            </div>
          )}
        </div>

        {/* Interior Finish */}
        <div className="space-y-2">
          <Label htmlFor="interiorFinish">Interior Finish</Label>
          <Controller
            name="interiorFinish"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="interiorFinish">
                  <SelectValue placeholder="Select interior finish" />
                </SelectTrigger>
                <SelectContent>
                  {INTERIOR_FINISH_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.interiorFinish && (
            <p className="text-sm text-destructive">{errors.interiorFinish.message}</p>
          )}
          {selectedInterior === "Other" && (
            <div className="pt-2">
              <Label htmlFor="interiorFinishOther">Specify Interior Finish</Label>
              <Input id="interiorFinishOther" placeholder="Enter interior finish" {...register("interiorFinishOther")} />
            </div>
          )}
        </div>

        {/* Hardware (Multiselect) */}
        <div className="space-y-2 md:col-span-2">
          <Label>Hardware</Label>
          <Controller
            control={control}
            name="hardware"
            render={({ field }) => (
              <HardwareMultiSelect value={field.value} onChange={field.onChange} />
            )}
          />
        </div>

        <Separator className="md:col-span-2" />

        <div className="flex items-center gap-3 md:col-span-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Casket"}
          </Button>
          <Button type="button" variant="outline" onClick={() => reset()}>
            Reset
          </Button>
        </div>
      </form>

      {/* Success Modal */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Saved Successfully</DialogTitle>
            <DialogDescription>
              The casket/coffin record has been saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSuccessOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Hardware Multiselect Component ---
function HardwareMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const toggleItem = (item: string) => {
    if (value.includes(item)) {
      onChange(value.filter((v) => v !== item));
    } else {
      onChange([...value, item]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="justify-between">
            {value.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {value.map((v) => (
                  <Badge key={v} variant="secondary" className="rounded-2xl">
                    {v}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">Select hardware</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[320px] p-2">
          <div className="max-h-64 overflow-auto pr-1">
            {HARDWARE_OPTIONS.map((opt) => {
              const checked = value.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleItem(opt)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-md px-3 py-2 text-left hover:bg-accent",
                    checked && "bg-accent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox checked={checked} onCheckedChange={() => toggleItem(opt)} />
                    <span>{opt}</span>
                  </div>
                  {checked && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
          <Separator className="my-2" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <PlusCircle className="h-3.5 w-3.5" />
            Only predefined options are available.
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

