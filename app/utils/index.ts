import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useMediaQuery } from "~/hooks/useMedia";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getPage(searchParams: URLSearchParams) {
  return {
    page: Number(searchParams.get("page") || "0"),
  };
}

export function useResponsiveLanes() {
  const isExtraLarge = useMediaQuery("(min-width: 1502px)");
  const isLarge = useMediaQuery("(min-width: 1220px)");
  const isMedium = useMediaQuery("(min-width: 1080px)");

  if (isExtraLarge) return 4;
  if (isLarge) return 3;
  if (isMedium) return 2;

  return 2;
}

export type Post = {
  id: number;
  title: string;
  height: number;
  backgroundColor: string;
};

export async function getPosts({
  page,
  limit,
}: {
  page: number;
  limit: number;
}) {
  const total = 1000;
  const start = page * limit;
  const end = Math.min(start + limit, total);

  const posts = Array.from({ length: end - start }, (_, i) => ({
    id: start + i,
    title: `Post ${start + i}`,
    height: 100 + Math.floor(Math.random() * 300),
    backgroundColor: `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(
      Math.random() * 255
    )}, ${Math.floor(Math.random() * 255)})`,
  }));

  await wait(1000);

  return { posts, total };
}
