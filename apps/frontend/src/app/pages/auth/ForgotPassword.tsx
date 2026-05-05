"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import axios from "axios";
import { ArrowLeft, Mail } from "lucide-react";
import { AUTH_API_URL } from "@/lib/auth-api-url";

const formSchema = z.object({
  email: z.string().email("Email invalide"),
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await axios.post(`${AUTH_API_URL}/auth/forgot-password`, {
        email: data.email,
      });

      toast.success("Code de réinitialisation envoyé à votre email!");
      navigate("/reset-password", { state: { email: data.email } });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Erreur lors de l'envoi du code de réinitialisation";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex min-h-full flex-1">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full lg:w-96">
          <div>
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
              aria-label="Retour à la page de connexion"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Retour à la connexion
            </button>
            <img
              src="/logo.png"
              alt="SmartSite"
              className="h-16 w-16 object-contain"
            />
            <h2 className="mt-8 text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-white">
              Réinitialiser votre mot de passe
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Entrez votre adresse email et nous vous enverrons un code de
              réinitialisation.
            </p>
          </div>

          <div className="mt-10">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          placeholder="vous@example.com"
                          className="pl-10"
                          aria-required="true"
                          aria-describedby={fieldState.invalid ? "email-error" : undefined}
                          disabled={isLoading}
                        />
                      </div>
                      {fieldState.invalid && (
                        <FieldError id="email-error" errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isLoading
                  ? "Envoi en cours..."
                  : "Envoyer le code de réinitialisation"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Right side image */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="bg2.jpg"
          alt=""
        />
        <div className="absolute inset-0 " />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            
          </div>
        </div>
      </div>
    </div>
  );
}
