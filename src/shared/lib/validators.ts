import { z } from "zod";

const email = z.string().trim().email({ message: "Введите корректный email" });

const password = z
    .string()
    .min(8, { message: "Минимум 8 символов" })
    .regex(/[A-Za-z]/, { message: "Добавьте хотя бы одну букву" })
    .regex(/[0-9]/, { message: "Добавьте хотя бы одну цифру" });

export const loginSchema = z.object({
    email,
    password: z.string().min(1, { message: "Введите пароль" }),
});

export const registerSchema = z
    .object({
        email,
        password,
        confirmPassword: z.string().min(1, { message: "Повторите пароль" }),
    })
    .refine((v) => v.password === v.confirmPassword, {
        message: "Пароли не совпадают",
        path: ["confirmPassword"],
    });

export const forgotSchema = z.object({
    email,
});

export const resetSchema = z
    .object({
        token: z.string().min(1, { message: "Отсутствует token" }),
        password,
        confirmPassword: z.string().min(1, { message: "Повторите пароль" }),
    })
    .refine((v) => v.password === v.confirmPassword, {
        message: "Пароли не совпадают",
        path: ["confirmPassword"],
    });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotValues = z.infer<typeof forgotSchema>;
export type ResetValues = z.infer<typeof resetSchema>;
