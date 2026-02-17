import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address, chars = 4) {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatETH(value, decimals = 4) {
  if (!value) return "0";
  const num = parseFloat(value);
  return num.toFixed(decimals).replace(/\.?0+$/, "");
}
