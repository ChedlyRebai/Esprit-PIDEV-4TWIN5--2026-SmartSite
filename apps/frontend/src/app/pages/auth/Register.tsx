"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/app/store/authStore";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { SmartSiteLogo } from "@/app/components/branding/SmartSiteLogo";
import { roleLabels } from "@/app/utils/roleConfig";
import type { RoleType } from "@/app/types";

// Liste des roles disponibles (sauf super_admin)
const availableRoles: RoleType[] = [
  "director",
  "project_manager",
  "site_manager",
  "works_manager",
  "accountant",
  "procurement_manager",
  "qhse_manager",
  "client",
  "subcontractor",
  "user",
];

const phoneCountryCodes = [
  { label: "Tunisie (+216)", value: "+216" },
  { label: "France (+33)", value: "+33" },
  { label: "Maroc (+212)", value: "+212" },
  { label: "Algérie (+213)", value: "+213" },
  { label: "Belgique (+32)", value: "+32" },
  { label: "Suisse (+41)", value: "+41" },
  { label: "Canada (+1)", value: "+1-ca" },
  { label: "USA (+1)", value: "+1-us" },
];

// Helper function to convert phone code values back to proper format
const getPhoneCode = (value: string): string => {
  switch (value) {
    case '+1-ca':
    case '+1-us':
      return '+1';
    default:
      return value;
  }
};

const formSchema = z.object({
  cin: z
    .string()
    .min(5, "CIN is required and must be at least 5 characters.")
    .max(32, "CIN must not exceed 32 characters."),
  firstName: z
    .string()
    .min(2, "First name is required and must be at least 2 characters.")
    .max(50, "First name must not exceed 50 characters."),
  lastName: z
    .string()
    .min(2, "Name is required and must be at least 2 characters.")
    .max(50, "Name must not exceed 50 characters."),
  email: z
    .string()
    .email("Please enter a valid email address.")
    .min(5, "Email is required."),
  telephone: z
    .string()
    .regex(/^\d{6,14}$/, "Invalid number (6 to 14 digits)."),
  phoneCountryCode: z.string().min(2, "Please select a country code."),
  country: z
    .string()
    .min(2, "Country is required.")
    .max(56, "Country name is too long."),
  city: z
    .string()
    .min(2, "City is required.")
    .max(80, "City name is too long.")
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/, "Invalid city."),
  postalCode: z
    .string()
    .min(3, "Postal code is required.")
    .max(12, "Invalid postal code.")
    .regex(/^[A-Za-z0-9 -]+$/, "Invalid postal code."),
  addressLine: z
    .string()
    .min(5, "Address is required and must be at least 5 characters.")
    .max(200, "Address must not exceed 200 characters."),
  role: z.string().min(1, "Role is required."),
  acceptTerms: z
    .boolean()
    .refine(
      (val) => val === true,
      "You must accept the acceptance criteria to continue.",
    ),
  acceptReglement: z
    .boolean()
    .refine(
      (val) => val === true,
      "You must accept the regulations to continue.",
    ),
});

type RegisterFormData = z.infer<typeof formSchema>;

const STEP_1_FIELDS: (keyof RegisterFormData)[] = [
  "cin",
  "email",
  "firstName",
  "lastName",
  "phoneCountryCode",
  "telephone",
  "country",
  "city",
  "postalCode",
  "addressLine",
  "role",
];

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const [isLoading, setIsLoading] = React.useState(false);
  const [step, setStep] = React.useState<1 | 2 | 3>(1);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cin: "",
      firstName: "",
      lastName: "",
      email: "",
      telephone: "",
      phoneCountryCode: "+216",
      country: "",
      city: "",
      postalCode: "",
      addressLine: "",
      role: "",
      acceptTerms: false,
      acceptReglement: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const fullAddress = `${data.addressLine}, ${data.city}, ${data.postalCode}, ${data.country}`;
      const fullPhone = `${getPhoneCode(data.phoneCountryCode)} ${data.telephone}`;
      await register(
        data.cin,
        "", // mot de passe vide à l'inscription, généré à l'approbation
        data.firstName,
        data.lastName,
        data.email,
        fullPhone,
        "", // pas de département
        fullAddress,
        data.role,
      );
      toast.success(
        "Inscription réussie! Votre compte est en attente d'approbation.",
      );
      // Redirect to login page
      navigate("/login");
    } catch (error: any) {
      console.error("Erreur inscription:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Une erreur est survenue lors de l'inscription.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const onInvalid = (errors: FieldErrors<RegisterFormData>) => {
    const first = Object.values(errors)[0];
    const msg =
      first && typeof first === "object" && "message" in first
        ? String(first.message)
        : null;
    toast.error(
      msg ?? "Veuillez compléter tous les champs obligatoires et cocher les cases.",
    );
  };

  const goToStep2 = async () => {
    const ok = await form.trigger(STEP_1_FIELDS);
    if (!ok) {
      toast.error("Veuillez corriger les champs du formulaire.");
      return;
    }
    setStep(2);
  };

  const goToStep3 = () => {
    form.setValue("acceptTerms", true, { shouldValidate: false });
    setStep(3);
  };

  const goBackToStep1 = () => {
    form.setValue("acceptTerms", false);
    form.setValue("acceptReglement", false);
    setStep(1);
  };

  const goBackToStep2From3 = () => {
    form.setValue("acceptReglement", false);
    setStep(2);
  };

  const submitFinal = () => {
    form.setValue("acceptReglement", true, { shouldValidate: false });
    void form.handleSubmit(onSubmit, onInvalid)();
  };

  return (
    <div className="min-h-screen flex min-h-full flex-1">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-lg lg:w-2xl">
          <div>
            <a href="/" className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md">
              <SmartSiteLogo size="sm" />
            </a>
            <p className="mt-2 text-xs font-semibold tracking-[0.2em] text-slate-600 uppercase">
              Intelligent construction platform
            </p>
            <h2 className="mt-6 text-2xl font-bold leading-9 tracking-tight text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Sign in
              </a>
            </p>
          </div>

          <div className="mt-10">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {([1, 2, 3] as const).map((s) => (
                    <React.Fragment key={s}>
                      {s > 1 && (
                        <span className="text-slate-300 hidden sm:inline">—</span>
                      )}
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${step === s
                          ? "bg-indigo-600 text-white"
                          : step > s
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-slate-100 text-slate-500"
                          }`}
                      >
                        {s === 1
                          ? "1. Information"
                          : s === 2
                            ? "2. Criteria"
                            : "3. Regulations"}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
                <CardTitle>
                  {step === 1 && "Registration Form"}
                  {step === 2 && "Acceptance Criteria"}
                  {step === 3 && "Platform Regulations"}
                </CardTitle>
                <CardDescription>
                  {step === 1 &&
                    "Fill in your information, then validate to read the conditions one by one."}
                  {step === 2 &&
                    "Read the criteria carefully. Click the button when you accept them."}
                  {step === 3 &&
                    "Final step: read the regulations then send your registration request."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="space-y-6"
                  noValidate
                >
                  {step === 1 && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FieldGroup>
                          <Controller
                            name="cin"
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="cin">CIN *</FieldLabel>
                                <Input
                                  {...field}
                                  id="cin"
                                  placeholder="Enter your CIN"
                                  aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && (
                                  <FieldError errors={[fieldState.error]} />
                                )}
                              </Field>
                            )}
                          />
                        </FieldGroup>

                        <FieldGroup>
                          <Controller
                            name="email"
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="email">Email *</FieldLabel>
                                <Input
                                  {...field}
                                  id="email"
                                  type="email"
                                  placeholder="Enter your email"
                                  aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && (
                                  <FieldError errors={[fieldState.error]} />
                                )}
                              </Field>
                            )}
                          />
                        </FieldGroup>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FieldGroup>
                          <Controller
                            name="firstName"
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="firstname">
                                  First Name *
                                </FieldLabel>
                                <Input
                                  {...field}
                                  id="firstName"
                                  placeholder="Enter your first name"
                                  aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && (
                                  <FieldError errors={[fieldState.error]} />
                                )}
                              </Field>
                            )}
                          />
                        </FieldGroup>

                        <FieldGroup>
                          <Controller
                            name="lastName"
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="lastName">Last Name *</FieldLabel>
                                <Input
                                  {...field}
                                  id="lastName"
                                  placeholder="Enter your last name"
                                  aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && (
                                  <FieldError errors={[fieldState.error]} />
                                )}
                              </Field>
                            )}
                          />
                        </FieldGroup>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FieldGroup>
                          <Controller
                            name="phoneCountryCode"
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="phoneCountryCode">
                                  Country (code) *
                                </FieldLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <SelectTrigger id="phoneCountryCode">
                                    <SelectValue placeholder="Code" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {phoneCountryCodes.map((item) => (
                                      <SelectItem
                                        key={`${item.label}-${item.value}`}
                                        value={item.value}
                                      >
                                        {item.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {fieldState.invalid && (
                                  <FieldError errors={[fieldState.error]} />
                                )}
                              </Field>
                            )}
                          />
                        </FieldGroup>

                        <div className="md:col-span-2">
                          <FieldGroup>
                            <Controller
                              name="telephone"
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel htmlFor="telephone">
                                    Phone *
                                  </FieldLabel>
                                  <Input
                                    {...field}
                                    id="telephone"
                                    placeholder="12345678"
                                    aria-invalid={fieldState.invalid}
                                  />
                                  <FieldDescription>
                                    Enter numbers only, country code is selected on the left.
                                  </FieldDescription>
                                  {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                  )}
                                </Field>
                              )}
                            />
                          </FieldGroup>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FieldGroup>
                          <Controller
                            name="country"
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="country">Country *</FieldLabel>
                                <Input
                                  {...field}
                                  id="country"
                                  placeholder="Tunisia"
                                  aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && (
                                  <FieldError errors={[fieldState.error]} />
                                )}
                              </Field>
                            )}
                          />
                        </FieldGroup>

                        <FieldGroup>
                          <Controller
                            name="city"
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="city">City *</FieldLabel>
                                <Input
                                  {...field}
                                  id="city"
                                  placeholder="Tunis"
                                  aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && (
                                  <FieldError errors={[fieldState.error]} />
                                )}
                              </Field>
                            )}
                          />
                        </FieldGroup>

                        <FieldGroup>
                          <Controller
                            name="postalCode"
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="postalCode">
                                  Postal Code *
                                </FieldLabel>
                                <Input
                                  {...field}
                                  id="postalCode"
                                  placeholder="1000"
                                  aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && (
                                  <FieldError errors={[fieldState.error]} />
                                )}
                              </Field>
                            )}
                          />
                        </FieldGroup>
                      </div>

                      <FieldGroup>
                        <Controller
                          name="addressLine"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel htmlFor="addressLine">
                                Address (street / number) *
                              </FieldLabel>
                              <Input
                                {...field}
                                id="addressLine"
                                placeholder="Street name..., N 15"
                                aria-invalid={fieldState.invalid}
                              />
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </Field>
                          )}
                        />
                      </FieldGroup>

                      <FieldGroup>
                        <Controller
                          name="role"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel htmlFor="role">Role *</FieldLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger id="role">
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableRoles.map((roleName) => (
                                    <SelectItem key={roleName} value={roleName}>
                                      {roleLabels[roleName] || roleName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </Field>
                          )}
                        />
                      </FieldGroup>

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                          type="button"
                          onClick={goToStep2}
                          className="flex-1 rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                        >
                          Continue to acceptance criteria
                        </Button>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <div className="space-y-5">
                      <div className="max-h-[min(420px,55vh)] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700 shadow-inner">
                        <h4 className="font-semibold text-base text-slate-900 mb-3 flex items-center gap-2">
                          <span aria-hidden>📋</span> Acceptance Criteria
                        </h4>
                        <p className="mb-3 text-slate-600">
                          Before submitting your registration request,
                          please note that:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                          <li>
                            The information provided must be accurate and verifiable
                          </li>
                          <li>
                            The profile must match the requirements of the requested role
                          </li>
                          <li>
                            A verification will be performed by our administrative team
                          </li>
                          <li>
                            The approval process may take 24-48 hours
                          </li>
                          <li>
                            A confirmation email will be sent after validation
                          </li>
                        </ul>
                      </div>
                      <p className="text-xs text-slate-500">
                        Scroll the text above if needed, then confirm your agreement.
                      </p>
                      <div className="flex flex-col-reverse sm:flex-row gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={goBackToStep1}
                          className="flex-1"
                        >
                          Back to form
                        </Button>
                        <Button
                          type="button"
                          onClick={goToStep3}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
                        >
                          I have read and accept these criteria
                        </Button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-5">
                      <div className="max-h-[min(420px,55vh)] overflow-y-auto rounded-xl border border-blue-200 bg-blue-50/80 p-5 text-sm text-slate-800 shadow-inner">
                        <h4 className="font-semibold text-base text-blue-950 mb-3 flex items-center gap-2">
                          <span aria-hidden>📜</span> Platform Regulations
                        </h4>
                        <p className="mb-3 text-blue-950/90">
                          By using the SmartSite platform, you commit to respecting:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 leading-relaxed text-blue-950/90">
                          <li>
                            Privacy and security policies
                          </li>
                          <li>
                            Provide accurate and up-to-date information
                          </li>
                          <li>
                            Use the platform for professional purposes only
                          </li>
                          <li>
                            Do not share your credentials with third parties
                          </li>
                          <li>
                            Respect other users and collaborators
                          </li>
                          <li>
                            Report any issues or anomalies promptly
                          </li>
                          <li>
                            Accept final administrative decisions
                          </li>
                        </ul>
                        <p className="mt-4 font-semibold text-blue-950 border-t border-blue-200 pt-4">
                          Any violation of the regulations may result in the suspension or deletion of your account.
                        </p>
                      </div>
                      <div className="flex flex-col-reverse sm:flex-row gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={goBackToStep2From3}
                          disabled={isLoading}
                          className="flex-1"
                        >
                          Back to criteria
                        </Button>
                        <Button
                          type="button"
                          disabled={isLoading}
                          onClick={submitFinal}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
                        >
                          {isLoading ? (
                            <>
                              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 align-middle" />
                              Sending...
                            </>
                          ) : (
                            "I accept the regulations and send my request"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1496917756835-20cb06e75b4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1908&q=80"
          alt=""
        />
      </div>
    </div>
  );
}
