"use client";

import { Toaster } from "@/components/ui/sonner";

/**
 * Mounts the Sonner toaster once at the app root so any client component can
 * fire transient snackbar notifications (used for the complete/delete undo flows).
 */
export function ToasterProvider() {
  return <Toaster position="bottom-center" richColors closeButton />;
}
