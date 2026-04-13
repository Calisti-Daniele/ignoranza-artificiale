import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { v4 as uuidv4 } from 'uuid'
import { LOCALSTORAGE_SESSION_ID } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatItalianDate(isoString: string): string {
  try {
    const date = new Date(isoString)
    return format(date, "d MMMM yyyy 'alle' HH:mm", { locale: it })
  } catch {
    return isoString
  }
}

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function generateConversationId(): string {
  return uuidv4()
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return generateConversationId()
  const existing = localStorage.getItem(LOCALSTORAGE_SESSION_ID)
  if (existing && UUID_V4_RE.test(existing)) return existing
  const newId = generateConversationId()
  localStorage.setItem(LOCALSTORAGE_SESSION_ID, newId)
  return newId
}
