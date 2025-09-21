// Файл: app/components/DraggableShift.tsx
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { EmployeeAvailability } from '../types/scheduler';

interface DraggableShiftProps {
  shift: EmployeeAvailability;
  children: React.ReactNode;
}

export function DraggableShift({ shift, children }: DraggableShiftProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `shift-${shift.id}`, 
    data: { shift }, 
  });

  const style = {
    transform: CSS.Translate.toString(transform), 
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}