import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/input-group";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import * as z from "zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { createRole, getRoleById, updateRole } from "@/app/action/role.action";
import useRoleModal from "@/app/hooks/use-role-Modal";

const formSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(5, "Role name must be at least 5 characters.")
    .max(32, "Role name must be at most 32 characters."),
  description: z.string().optional(),
});

const RoleForms = ({ type }: { type: "edit" | "add" }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: undefined,
      name: "",
      description: "",
    },
  });
  const { id, onClose, onRoleChange } = useRoleModal();
  const loadRoleData = async () => {
    try {
      console.log("Loading role data for ID:", id);
      const res = await getRoleById(id as string);
      if (res.status === 200) {
        form.reset({
          id: res.data._id,
          name: res.data.name,
          description: res.data.description,
        });
      }
    } catch (error: any) {
      toast.error("Failed to load role data. Please try again.");
    }
  };

  useEffect(() => {
    if (type === "edit") {
      loadRoleData();

    }
  }, [type]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (type === "add") {
        const res = await createRole(data.name, data.description);
        if (res.status === 201) {
          toast.success("Role created successfully");
          form.reset();
          onClose();
          onRoleChange();
        } else {
          toast.error(res.data || "Failed to create role");
        }
      } else {
        const res = await updateRole(data.id!, data.name, data.description);
        if (res.status === 200 || res.status === 204) {
          toast.success("Role updated successfully");
          form.reset();
          onClose();
          onRoleChange();
        } else {
          toast.error(res.data || "Failed to update role");
        }
      }
    } catch (error: any) {
      toast.error("Failed to save role. Please try again.");
    }
  };
  return (
    <>
      <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-rhf-demo-name">Role Name</FieldLabel>
                <Input
                  {...field}
                  id="form-rhf-demo-name"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter role name"
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-rhf-demo-description">
                  Description
                </FieldLabel>
                <InputGroup>
                  <InputGroupTextarea
                    {...field}
                    id="form-rhf-demo-description"
                    placeholder="Enter role description"
                    rows={6}
                    className="min-h-24 resize-none"
                    aria-invalid={fieldState.invalid}
                  />
                  <InputGroupAddon align="block-end">
                    <InputGroupText className="tabular-nums">
                      {field.value.length}/100 characters
                    </InputGroupText>
                  </InputGroupAddon>
                </InputGroup>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </form>

      <Field className="justify-end" orientation="horizontal">
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Reset
        </Button>
        <Button type="submit" form="form-rhf-demo">
          Submit
        </Button>
      </Field>
    </>
  );
};

export default RoleForms;
