import { Fragment, type ReactNode } from "react";

/**
 * Text ze slovníku s vloženými prvky (odkaz, tučné):
 *   rich("Napiš na {email}.", { email: <strong>a@b.cz</strong> })
 * Pořadí slov tak zůstává ve slovníku a každý jazyk si ho určí sám.
 */
export function rich(template: string, parts: Record<string, ReactNode>): ReactNode {
  return template.split(/(\{\w+\})/g).map((chunk, i) => {
    const key = chunk.match(/^\{(\w+)\}$/)?.[1];
    return <Fragment key={i}>{key && key in parts ? parts[key] : chunk}</Fragment>;
  });
}
