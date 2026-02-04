"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { DefaultValues, FieldValues, Path, SubmitHandler, useForm } from "react-hook-form";
import { z, ZodType } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ROUTES from "@/constants/routes";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AuthFormProps<T extends FieldValues> {
  schema: ZodType<T>;
  defaultValues: T;
  onSubmit: (data: T) => Promise<ActionResponse>;
  formType: "SIGN_IN" | "SIGN_UP";
}

const AuthForm = <T extends FieldValues>({ schema, defaultValues, formType, onSubmit }: AuthFormProps<T>) => {
  const router = useRouter();
  const form = useForm<T>({
    // @ts-expect-error - standardSchemaResolver type inference issue with generics
    resolver: standardSchemaResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
  });

  const handleSubmit: SubmitHandler<T> = async (data) => {
    const result = (await onSubmit(data)) as ActionResponse;

    if (result?.success) {
      toast(formType === "SIGN_IN" ? "You have been signed in successfully" : "You have been signed up successfully");
      router.push(ROUTES.HOME);
    } else {
      toast(result.error?.message || "An error occurred", {
        description: result.status ? `Error: ${result.status}` : undefined,
      });
    }
  };

  const buttonText = formType === "SIGN_IN" ? "Sign In" : "Sign Up";

  return (
    <Form {...form}>
      {/* @ts-expect-error - handleSubmit type inference issue with generics */}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-10 space-y-6">
        {Object.keys(defaultValues).map((field) => (
          <FormField
            key={field}
            // @ts-expect-error - FormField control type inference issue with generics
            control={form.control}
            name={field as Path<T>}
            render={({ field }) => (
              <FormItem className="flex w-full flex-col gap-2.5">
                <FormLabel className="paragraph-medium text-dark400_light700">
                  {field.name === "email" ? "Email Address" : field.name.charAt(0).toUpperCase() + field.name.slice(1)}
                </FormLabel>
                <FormControl>
                  <Input
                    required
                    type={field.name === "password" ? "password" : field.name === "email" ? "email" : "text"}
                    {...field}
                    className="paragraph-regular background-light900_dark300 light-border-2 text-dark300_light700 no-focus rounded-1.5 min-h-12 border"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="primary-gradient paragraph-medium rounded-2 font-inter text-light-900! min-h-12 w-full px-4 py-3"
        >
          {form.formState.isSubmitting ? (buttonText === "Sign In" ? "Signing In..." : "Signing Up...") : buttonText}
        </Button>
        {formType === "SIGN_IN" ? (
          <p>
            Don&apos;t have an account?{" "}
            <Link className="paragraph-semibold primary-text-gradient" href={ROUTES.SIGN_UP}>
              Sign Up
            </Link>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <Link href={ROUTES.SIGN_IN} className="paragraph-semibold primary-text-gradient">
              Sign In
            </Link>
          </p>
        )}
      </form>
    </Form>
  );
};

export default AuthForm;
