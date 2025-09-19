import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
// Replace external icon import with fallback text/icon
// import { CalendarIcon } from "lucide-react";

interface PersonInvolved {
  fullName: string;
  role: string;
  contactNumber: string;
  email: string;
}

interface IncidentFormValues {
  dateOfIncident: Date;
  timeOfIncident: string;
  location: string;
  reportedBy: {
    name: string;
    role: string;
    contactNumber: string;
    email: string;
  };
  personsInvolved: PersonInvolved[];
}

export default function IncidentReportForm() {
  const form = useForm<IncidentFormValues>({
    defaultValues: {
      personsInvolved: [{ fullName: "", role: "", contactNumber: "", email: "" }],
    },
  });

  const { control, register } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "personsInvolved",
  });

  return (
    <Form {...form}>
      <form className="space-y-8">
        {/* 1. General Information */}
        <Card>
          <CardContent className="grid gap-4 p-4">
            <h2 className="text-lg font-semibold">1. General Information</h2>

            {/* Date of Incident */}
            <FormField
              control={control}
              name="dateOfIncident"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Incident</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          <span className="mr-2 h-4 w-4">📅</span>
                          {field.value ? format(field.value, "PPP") : "Pick a date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time of Incident */}
            <FormField
              control={control}
              name="timeOfIncident"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time of Incident</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Office">Office</SelectItem>
                      <SelectItem value="Workshop">Workshop</SelectItem>
                      <SelectItem value="Showroom">Showroom</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reported By */}
            <div className="grid gap-4 border-t pt-4">
              <h3 className="font-medium">Reported By</h3>
              <FormField control={control} name="reportedBy.name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={control} name="reportedBy.role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Office Staff">Office Staff</SelectItem>
                      <SelectItem value="Workshop Staff">Workshop Staff</SelectItem>
                      <SelectItem value="Visitor">Visitor</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={control} name="reportedBy.contactNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={control} name="reportedBy.email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* 2. Person(s) Involved */}
        <Card>
          <CardContent className="grid gap-4 p-4">
            <h2 className="text-lg font-semibold">2. Person(s) Involved</h2>
            {fields.map((item, index) => (
              <div key={item.id} className="grid gap-4 border rounded-xl p-4 relative">
                <div className="absolute right-4 top-4">
                  <Button variant="destructive" size="sm" onClick={() => remove(index)}>Remove</Button>
                </div>
                <FormField control={control} name={`personsInvolved.${index}.fullName`} render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={control} name={`personsInvolved.${index}.role`} render={({ field }) => (
                  <FormItem><FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Carpenter">Carpenter</SelectItem>
                        <SelectItem value="Finisher">Finisher</SelectItem>
                        <SelectItem value="Office Staff">Office Staff</SelectItem>
                        <SelectItem value="Customer/Visitor">Customer/Visitor</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={control} name={`personsInvolved.${index}.contactNumber`} render={({ field }) => (
                  <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={control} name={`personsInvolved.${index}.email`} render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>
                )} />
              </div>
            ))}
            <Button type="button" onClick={() => append({ fullName: "", role: "", contactNumber: "", email: "" })}>
              Add Person
            </Button>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}

