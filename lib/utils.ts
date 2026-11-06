import { clsx, type ClassValue } from 'clsx'
import type { CSSProperties } from 'react'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** An element's place in a staggered entrance. See the entrance rules in globals.css. */
export function stagger(i: number) {
  return { '--i': i } as CSSProperties
}
