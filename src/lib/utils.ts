/* eslint-disable @typescript-eslint/no-explicit-any */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Valida CPF (formato brasileiro) — ignora formatação e checa dígitos verificadores
 */
export function isValidCPF(value?: string | null): boolean {
  if (!value) return false;
  const s = String(value).replace(/\D/g, "");
  if (s.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(s)) return false; // todos dígitos iguais
  const nums = s.split("").map((d) => parseInt(d, 10));

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += nums[i] * (10 - i);
  let rev = sum % 11;
  const check1 = rev < 2 ? 0 : 11 - rev;
  if (check1 !== nums[9]) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += nums[i] * (11 - i);
  rev = sum % 11;
  const check2 = rev < 2 ? 0 : 11 - rev;
  return check2 === nums[10];
}

/**
 * Formata um CPF (apenas formatação visual).
 * Recebe dígitos ou CPF já formatado e retorna no formato 000.000.000-00
 */
export function formatCPF(value?: string | null): string {
  if (!value) return "";
  const digits = String(value).replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Sanitiza uma string de entrada para aceitar apenas números e ponto decimal.
 * - substitui vírgula por ponto
 * - remove caracteres que não sejam dígito ou ponto
 * - permite no máximo um ponto
 * - garante que entradas como ".5" virem "0.5"
 */
export function sanitizeFloatInput(value: string | undefined): string {
  if (!value) return "";
  let v = String(value).replace(/,/g, ".");
  v = v.replace(/[^0-9.]/g, "");
  const parts = v.split(".");
  if (parts.length > 1) {
    const first = parts.shift() || "";
    v = first + "." + parts.join("");
  }
  if (v.startsWith(".")) v = "0" + v;
  return v;
}

export function parseSafeFloat(value: string | undefined, fallback = 0): number {
  if (!value) return fallback;
  const n = parseFloat(String(value).replace(/,/g, "."));
  return Number.isFinite(n) ? n : fallback;
}
