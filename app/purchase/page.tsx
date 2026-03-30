"use client";

import { useEffect } from "react";

export default function PurchaseRedirect() {
  useEffect(() => {
    // Redirect to /bom
    window.location.href = "/bom";
  }, []);

  return null;
}

  