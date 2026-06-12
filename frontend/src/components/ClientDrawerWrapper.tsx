"use client";

import dynamic from "next/dynamic";

const CartDrawer = dynamic(() => import("./CartDrawer"), { ssr: false });

export default function ClientDrawerWrapper() {
  return <CartDrawer />;
}
