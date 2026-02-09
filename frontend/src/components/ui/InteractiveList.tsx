'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ListItem {
  id: string;
  label: string;
}

const initialItems: ListItem[] = [
  { id: '1', label: 'Transporte' },
  { id: '2', label: 'Comida' },
  { id: '3', label: 'Servicios' },
];

export default function InteractiveList() {
  const [items, setItems] = useState<ListItem[]>(initialItems);
  const [inputValue, setInputValue] = useState('');
  const listRef = useRef<HTMLUListElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const updateModeRef = useRef<'append' | 'replace'>('replace');

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    if (updateModeRef.current === 'append' && items.length > 0) {
      const lastItem = items[items.length - 1];
      const li = document.createElement('li');
      li.textContent = lastItem.label;
      li.className = 'rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700';
      list.appendChild(li);
    } else {
      const children = items.map((item) => {
        const li = document.createElement('li');
        li.textContent = item.label;
        li.className = 'rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700';
        return li;
      });
      list.replaceChildren(...children);
    }

    updateModeRef.current = 'replace';
  }, [items]);

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }

    updateModeRef.current = 'append';
    setItems((prev) => [...prev, { id: `${Date.now()}`, label: trimmed }]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleReset = () => {
    updateModeRef.current = 'replace';
    setItems(initialItems);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor="new-item" className="text-sm font-medium text-gray-700">
          Nueva categoria
        </label>
        <input
          ref={inputRef}
          id="new-item"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-xs"
          placeholder="Ej: Salud"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Agregar
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Restaurar
          </button>
        </div>
      </div>
      <ul ref={listRef} role="list" className="grid gap-2 sm:grid-cols-2" />
    </div>
  );
}
