"use client";

import { useEffect } from "react";
import { recordVisit } from "@/lib/watchHistory";

export default function RecordVisit({
  id,
  title,
  poster_path,
  vote_average,
}: {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
}) {
  useEffect(() => {
    recordVisit({ id, title, poster_path, vote_average });
  }, [id, title, poster_path, vote_average]);

  return null;
}
