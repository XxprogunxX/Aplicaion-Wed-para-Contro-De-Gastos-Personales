'use client';

import React, { useState } from 'react';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
}

export default function Accordion({ items }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id} className="rounded-lg border border-gray-200 bg-white">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${item.id}`}
              id={`accordion-trigger-${item.id}`}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-800"
              onClick={() => setOpenId(isOpen ? null : item.id)}
            >
              {item.title}
              <span className="text-gray-500">{isOpen ? '−' : '+'}</span>
            </button>
            <div
              id={`accordion-panel-${item.id}`}
              role="region"
              aria-labelledby={`accordion-trigger-${item.id}`}
              hidden={!isOpen}
              className="px-4 pb-4 text-sm text-gray-600"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
