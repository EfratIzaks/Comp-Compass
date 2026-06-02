import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offer modeler | Compensation Workbench",
  description:
    "Interactive offer modeling: base, bonus, and equity with benchmark sliders and TTC summary.",
};

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
