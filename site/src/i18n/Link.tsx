"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { localePath } from "./config";
import { useLocale } from "./client";

/**
 * next/link, který drží jazyk: href="/turnaje" vede v angličtině na
 * /en/turnaje. Externí a relativní odkazy nechává beze změny.
 */
export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const locale = useLocale();
  const localized =
    typeof href === "string" && href.startsWith("/") && !href.startsWith("//") ? localePath(locale, href) : href;
  return <NextLink href={localized} {...props} />;
}
