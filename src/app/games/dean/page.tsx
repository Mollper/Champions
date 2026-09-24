import type { Metadata } from "next";
import { DeansSeat } from "@/components/games/deans-seat";

export const metadata: Metadata = { title: "The Dean's Seat" };

export default function DeanPage() {
  return <DeansSeat />;
}
