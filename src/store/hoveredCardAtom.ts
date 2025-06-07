import { atom } from "jotai";
import type { CardInstance } from "@/types/card";

export const hoveredCardAtom = atom<CardInstance | null>(null);