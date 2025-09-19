import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = [
  "Wood & Panel Materials",
  "Adhesives & Fillers",
  "Fasteners & Hardware",
  "Abrasives & Finishing",
  "Upholstery & Interior Materials",
  "Sealing & Lining",
  "Consumables for Tools & Machines",
  "Safety & Miscellaneous",
] as const;

const FormSchema = z.object({
  itemDescription: z
    .string()
    .min(2, { message: "Description must be at least 2 characters." })
    .max(120, { message: "Keep it under 120 characters." }),
  category: z.enum(categories, { required_error: "Please select a category." }),
  unitSize: z
    .string()
    .min(1, { message: "Unit size is required." })
    .max(60, { message: "Keep it under 60 characters." }),
  colour: z
    .string()
    .min(1, { message: "Colour is required." })
    .max(40, { message: "Keep it under 40 characters." }),
});

export type StockItemRegister = z.infer<typeof FormSchema>;

export default function StockItemRegisterForm() {
  const form = useForm<StockItemRegister>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      itemDescription: "",
      category: undefined as unknown as StockItemRegister["category"],
      unitSize: "",
      colour: "",
    },
    mode: "onBlur",
  });

  function onSubmit(values: StockItemRegister) {
    // Replace with your persistence layer call.
    // For now, we just log and show a quick inline confirmation.
    console.log("Stock Item Register submitted:", values);
    setSubmitted(values);
  }

  const [submitted, setSubmitted] = React.useState<StockItemRegister | null>(null);

  return (
    <div className="mx-auto max-w-2xl p-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Stock Item Register</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-6"
              noValidate
            >
              {/* Item Description */}
              <FormField
                control={form.control}
                name="itemDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 18mm MDF Board" {...field} />
                    </FormControl>
                    <FormDescription>
                      Short, human-friendly description used when selecting items later.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the group this stock item belongs to.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Unit Size */}
              <FormField
                control={form.control}
                name="unitSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Size</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 2440×1220×18mm or 5kg" {...field} />
                    </FormControl>
                    <FormDescription>
                      The purchasable unit (dimensions, weight, volume, etc.).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Colour */}
              <FormField
                control={form.control}
                name="colour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Colour</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Walnut" {...field} />
                    </FormControl>
                    <FormDescription>Primary colour or finish.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button type="submit" className="rounded-2xl px-6">
                  Save
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-2xl"
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
              </div>

              {submitted && (
                <div className="rounded-2xl border p-4 text-sm">
                  <div className="mb-2 font-medium">Saved preview</div>
                  <pre className="overflow-x-auto whitespace-pre-wrap text-xs">
                    {JSON.stringify(submitted, null, 2)}
                  </pre>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

