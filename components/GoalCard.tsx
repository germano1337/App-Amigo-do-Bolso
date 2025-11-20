import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Goal, GoalStatus } from '../types';
import { Calendar, Trash2, Target } from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  index: number;
  onDelete: (id: string) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, index, onDelete }) => {
  const progress = Math.min(100, Math.round((goal.saved / goal.amount) * 100));
  
  return (
    <Draggable draggableId={goal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-3 group transition-all ${
            snapshot.isDragging ? 'shadow-lg rotate-2 scale-105' : 'hover:shadow-md'
          }`}
          style={provided.draggableProps.style}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-slate-800 text-lg leading-tight">{goal.title}</h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(goal.id);
              }}
              className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Excluir objetivo"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="flex items-center text-slate-500 text-sm mb-3">
            <Calendar size={14} className="mr-1" />
            <span>{new Date(goal.deadline).toLocaleDateString('pt-BR')}</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <span>R$ {goal.saved.toLocaleString('pt-BR')}</span>
              <span className="text-emerald-600">Meta: R$ {goal.amount.toLocaleString('pt-BR')}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  goal.status === GoalStatus.DONE ? 'bg-emerald-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          
          {goal.status === GoalStatus.DONE && (
            <div className="mt-3 flex items-center justify-center bg-emerald-50 text-emerald-700 py-1 rounded-md text-xs font-bold uppercase tracking-wide">
              <Target size={14} className="mr-1" /> Conquistado!
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};