/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface MathTextProps {
  text: string;
  className?: string;
  block?: boolean;
}

export default function MathText({ text, className = '', block = false }: MathTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Fast check if window.katex exists
    const katex = (window as any).katex;
    if (!katex) {
      containerRef.current.innerText = text;
      return;
    }

    try {
      // Direct render parsing simple LaTeX math
      // Split by $ string blocks
      const parts = text.split(/(\$\$?.*?\$\$?)/g);
      containerRef.current.innerHTML = '';

      parts.forEach((part) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const content = part.slice(2, -2);
          const span = document.createElement('span');
          span.classList.add('block', 'my-2', 'text-center');
          try {
            span.innerHTML = katex.renderToString(content, { displayMode: true, throwOnError: false });
          } catch (e) {
            span.innerText = part;
          }
          containerRef.current?.appendChild(span);
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const content = part.slice(1, -1);
          const span = document.createElement('span');
          try {
            span.innerHTML = katex.renderToString(content, { displayMode: false, throwOnError: false });
          } catch (e) {
            span.innerText = part;
          }
          containerRef.current?.appendChild(span);
        } else {
          const node = document.createTextNode(part);
          containerRef.current?.appendChild(node);
        }
      });
    } catch (err) {
      console.warn('Error rendering KaTeX:', err);
      if (containerRef.current) {
        containerRef.current.innerText = text;
      }
    }
  }, [text]);

  return (
    <span
      ref={containerRef}
      className={`math-render inline-block align-baseline ${className}`}
      style={{ whiteSpace: 'pre-wrap' }}
    >
      {text}
    </span>
  );
}
