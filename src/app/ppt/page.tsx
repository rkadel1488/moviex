import type { Metadata } from "next";
import Studio from "@/components/ppt/Studio";

export const metadata: Metadata = {
  title: "SlideMorph AI — AI Presentation Studio",
  description:
    "Generate designed, animated presentations with Claude AI — morph transitions, in-browser presenting, and .pptx export.",
  robots: { index: false },
};

export default function PptPage() {
  return <Studio />;
}
