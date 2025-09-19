import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
// ⚠️ Fix: Avoid CDN calendar-icon path by importing locally from lucide-react
import { Calendar as CalendarIcon, Upload } from "lucide-react";

// ---------- Schema ----------
const phoneRegex = /^(\+?[0-9]{7,15})$/;

const emergencySchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  relationship: z.enum([
    "Husband",
    "Wife",
    "Son",
    "Daughter",
    "Mother",
    "Dad",
    "Other",
  ]),
  contactNumber: z.string().regex(phoneRegex, "Invalid phone number"),
  email: z.string().email("Invalid email"),
});

const formSchema = z.object({
  // Personal Information
  profilePhoto: z
    .any()
    .refine(
      (v) => v === undefined || v === null || (typeof File !== "undefined" && v instanceof File),
      "Invalid file"
    )
    .optional(),
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  dateOfBirth: z
    .date({ required_error: "Date of birth is required" })
    .max(new Date(), "Date cannot be in the future"),
  gender: z.enum(["Male", "Female"]),
  maritalStatus: z.enum(["Single", "Married", "Partner", "Other"]),
  nationality: z.enum(["Zimbabwean", "Other"]),

  // Contact Information
  phone: z.string().regex(phoneRegex, "Invalid phone number"),
  email: z.string().email("Invalid email"),
  address1: z.string().min(1, "Required"),
  address2: z.string().optional(),

  // Emergency Contact
  emergency: emergencySchema,

  // Employment Details
  employeeId: z.string().min(1, "Required"),
  jobTitle: z.string().min(1, "Required"),
  dateOfJoiningDate: z.date({ required_error: "Date of joining is required" }),
  dateOfJoiningTime: z.string().regex(/^\d{2}:\d{2}$/, "Select time"), // 24h HH:mm
  employmentType: z.enum(["Full-time", "Part-time", "Contract", "Intern"]),
  workLocation: z.enum([
    "Mutapa Store",
    "Mutapa Workshop",
    "Shurugwi Road Workshop",
    "Other",
  ]),
  status: z.enum(["Active", "On Leave", "Resigned", "Retired", "Other"]),

  // Experience
  skills: z.string().optional(),
  certifications: z.string().optional(),
});

export type DowntimeEpisodeFormValues = z.infer<typeof formSchema>;

// ---------- Helpers ----------
function combineDateAndTime(date: Date, timeHHmm: string) {
  const [h, m] = timeHHmm.split(":").map(Number);
  const combined = new Date(date);
  combined.setHours(h ?? 0, m ?? 0, 0, 0);
  return combined;
}

async function fileToBase64(file?: File | null): Promise<string | undefined> {
  if (!file) return undefined;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------- Component ----------
export default function DowntimeEpisodeForm() {
  const form = useForm<DowntimeEpisodeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nationality: "Zimbabwean",
      gender: "Male",
      maritalStatus: "Single",
      employmentType: "Full-time",
      workLocation: "Mutapa Store",
      status: "Active",
      address2: "",
      skills: "",
      certifications: "",
      emergency: {
        firstName: "",
        lastName: "",
        relationship: "Other",
        contactNumber: "",
        email: "",
      },
    },
    mode: "onBlur",
  });

  const [preview, setPreview] = React.useState<string | undefined>(undefined);

  const watchingPhoto = form.watch("profilePhoto");
  React.useEffect(() => {
    if (watchingPhoto && typeof URL !== "undefined" && typeof window !== "undefined") {
      if (watchingPhoto instanceof File) {
        const url = URL.createObjectURL(watchingPhoto);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
      }
    }
    setPreview(undefined);
  }, [watchingPhoto]);

  const onSubmit = async (values: DowntimeEpisodeFormValues) => {
    const doj = combineDateAndTime(values.dateOfJoiningDate, values.dateOfJoiningTime);

    const payload = {
      employee: {
        firstName: values.firstName,
        lastName: values.lastName,
        dateOfBirth: values.dateOfBirth.toISOString(),
        gender: values.gender,
        maritalStatus: values.maritalStatus,
        nationality: values.nationality,
        contact: {
          phone: values.phone,
          email: values.email,
          address1: values.address1,
          address2: values.address2 || null,
        },
        emergencyContact: values.emergency,
        employment: {
          employeeId: values.employeeId,
          jobTitle: values.jobTitle,
          dateOfJoining: doj.toISOString(),
          employmentType: values.employmentType,
          workLocation: values.workLocation,
          status: values.status,
        },
        experience: {
          skills: values.skills || "",
          certifications: values.certifications || "",
        },
        profilePhotoBase64: await fileToBase64(values.profilePhoto as File | undefined),
      },
      // Placeholder for downtime episode specific fields if needed later
      createdAt: new Date().toISOString(),
    };

    // Replace this with your actual API endpoint
    try {
      const res = await fetch("/api/downtime-episodes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");
      alert("Saved successfully");
      form.reset();
      setPreview(undefined);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error saving record");
    }
  };

  // ---------- Dev Self-Tests (run only in development) ----------
  React.useEffect(() => {
    if (typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production") {
      try {
        // combineDateAndTime test
        const d = new Date("2024-01-02T00:00:00.000Z");
        const c = combineDateAndTime(d, "08:30");
        console.assert(c.getHours() === 8 && c.getMinutes() === 30, "combineDateAndTime failed");

        // phone regex tests
        console.assert(phoneRegex.test("+263771234567"), "phoneRegex should accept +263...");
        console.assert(!phoneRegex.test("123"), "phoneRegex should reject short number");

        // schema happy path
        const ok = formSchema.safeParse({
          profilePhoto: undefined,
          firstName: "Jane",
          lastName: "Doe",
          dateOfBirth: new Date("1990-05-05"),
          gender: "Female",
          maritalStatus: "Single",
          nationality: "Zimbabwean",
          phone: "+263771234567",
          email: "jane@example.com",
          address1: "123 Street",
          address2: "",
          emergency: {
            firstName: "John",
            lastName: "Doe",
            relationship: "Husband",
            contactNumber: "+263771111111",
            email: "john@example.com",
          },
          employeeId: "EMP-001",
          jobTitle: "Technician",
          dateOfJoiningDate: new Date("2024-02-01"),
          dateOfJoiningTime: "08:00",
          employmentType: "Full-time",
          workLocation: "Mutapa Store",
          status: "Active",
          skills: "Hydraulics",
          certifications: "OSHA",
        });
        console.assert(ok.success, "formSchema should parse valid data");

        // schema negative test: invalid time
        const bad = formSchema.safeParse({
          ...((ok as any).data ?? {}),
          dateOfJoiningTime: "8:0",
        });
        console.assert(!bad.success, "formSchema should fail on invalid time format");
      } catch (err) {
        console.error("Dev self-tests failed:", err);
      }
    }
  }, []);

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Downtime Episode — Employee Details</h1>
        <div className="text-sm text-muted-foreground">All fields marked * are required</div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Information */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
              {/* Profile Photo */}
              <FormField
                control={form.control}
                name="profilePhoto"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>Profile Photo</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 overflow-hidden rounded-2xl border">
                          {preview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={preview} alt="Profile preview" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">No Image</div>
                          )}
                        </div>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-sm hover:bg-accent">
                          <Upload className="h-4 w-4" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => field.onChange(e.target.files?.[0] ?? undefined)}
                          />
                        </label>
                      </div>
                    </FormControl>
                    <FormDescription>Optional. JPG/PNG up to ~2MB.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:col-span-2 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* DOB */}
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Birth *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={"justify-start font-normal"}
                              type="button"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(d) => d && field.onChange(d)}
                            captionLayout="dropdown-buttons"
                            fromYear={1950}
                            toYear={new Date().getFullYear()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Gender */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Marital Status */}
                <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Partner">Partner</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nationality */}
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select nationality" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Zimbabwean">Zimbabwean</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +263771234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address1"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address Line 1 *</FormLabel>
                    <FormControl>
                      <Input placeholder="Street address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address2"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address Line 2</FormLabel>
                    <FormControl>
                      <Input placeholder="Apartment, suite, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="emergency.firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergency.lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergency.relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[
                          "Husband",
                          "Wife",
                          "Son",
                          "Daughter",
                          "Mother",
                          "Dad",
                          "Other",
                        ].map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergency.contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +263771234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergency.email"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee ID *</FormLabel>
                    <FormControl>
                      <Input placeholder="EMP-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Job Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Technician" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date of Joining date */}
              <FormField
                control={form.control}
                name="dateOfJoiningDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Joining (Date) *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className="justify-start font-normal" type="button">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(d) => d && field.onChange(d)}
                          captionLayout="dropdown-buttons"
                          fromYear={1990}
                          toYear={new Date().getFullYear() + 1}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Select the employment start date.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date of Joining time */}
              <FormField
                control={form.control}
                name="dateOfJoiningTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Joining (Time) *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormDescription>24-hour format (HH:mm).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Employment Type */}
              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Work Location */}
              <FormField
                control={form.control}
                name="workLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Location *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Mutapa Store">Mutapa Store</SelectItem>
                        <SelectItem value="Mutapa Workshop">Mutapa Workshop</SelectItem>
                        <SelectItem value="Shurugwi Road Workshop">Shurugwi Road Workshop</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="On Leave">On Leave</SelectItem>
                        <SelectItem value="Resigned">Resigned</SelectItem>
                        <SelectItem value="Retired">Retired</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Previous Experience / Skills */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Previous Experience / Work History</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills & Competencies</FormLabel>
                    <FormControl>
                      <Textarea rows={6} placeholder="e.g. Diesel engines, hydraulics, preventative maintenance..." {...field} />
                    </FormControl>
                    <FormDescription>Comma-separated or free-form notes.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="certifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certifications & Training</FormLabel>
                    <FormControl>
                      <Textarea rows={6} placeholder="e.g. OSHA, Defensive Driving, OEM certificates..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="sticky bottom-4 z-10 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              className="rounded-2xl"
            >
              Reset
            </Button>
            <Button type="submit" className="rounded-2xl">
              Save Record
            </Button>
          </div>
        </form>
      </Form>

      <p className="mt-8 text-xs text-muted-foreground">
        Note: Date & time are combined and sent in ISO-8601. Adjust server parsing as needed for your timezone (Africa/Harare).
      </p>
    </div>
  );
}

