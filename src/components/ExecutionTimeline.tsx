import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Cpu,
  MapPin,
  Building,
  Layers,
  CopyCheck,
  FileCheck2
} from 'lucide-react';
import { ExecutionStep } from '../types';

interface ExecutionTimelineProps {
  steps: ExecutionStep[];
  currentStepIndex: number;
}

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({ steps, currentStepIndex }) => {
  const getIcon = (id: string, status: string) => {
    if (status === 'running') {
      return <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />;
    }
    if (status === 'completed') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
    if (status === 'failed') {
      return <AlertCircle className="w-4 h-4 text-rose-600" />;
    }
    return <Clock className="w-4 h-4 text-slate-300" />;
  };

  return (
    <div className="bg-slate-900 text-white rounded-xl p-5 shadow-lg border border-slate-800">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <h4 className="text-sm font-semibold tracking-wide text-slate-200">
            Agent Execution Pipeline
          </h4>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Step {Math.min(currentStepIndex + 1, steps.length)} of {steps.length}
        </span>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isDone = step.status === 'completed';
          const isFailed = step.status === 'failed';
          const isRunning = step.status === 'running';

          return (
            <div
              key={step.id}
              className={`p-3 rounded-lg border transition-all ${
                isCurrent
                  ? 'bg-slate-800/90 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                  : isDone
                  ? 'bg-slate-800/40 border-slate-700/60'
                  : isFailed
                  ? 'bg-rose-950/40 border-rose-800/70'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{getIcon(step.id, step.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-xs font-medium ${
                        isCurrent ? 'text-indigo-300' : isDone ? 'text-slate-200' : isFailed ? 'text-rose-300' : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </p>
                    <span
                      className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                        isRunning
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : isDone
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : isFailed
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-0.5">{step.description}</p>

                  {step.detail && (
                    <div className="mt-1.5 text-[11px] font-mono bg-slate-950/80 text-emerald-300 px-2.5 py-1 rounded border border-slate-800 truncate">
                      {step.detail}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
