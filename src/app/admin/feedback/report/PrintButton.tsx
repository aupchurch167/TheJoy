"use client";

import { Button } from "@/components/admin/ui";

/**
 * Print / Save as PDF. The admin nav is hidden in print (see admin layout), so
 * the report exports clean for sharing with the team.
 */
export default function PrintButton() {
  return (
    <Button variant="primary" size="sm" onClick={() => window.print()}>
      Print / Save as PDF
    </Button>
  );
}
