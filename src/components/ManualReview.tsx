import { useState } from 'react';
import { AnalysisResult } from '@/api/client';
import Icon from '@/components/ui/icon';

interface ManualReviewProps {
  requirement: AnalysisResult | null;
  onClose: () => void;
  onApprove: (id: string, comment: string) => void;
  onReject: (id: string, comment: string) => void;
}

export default function ManualReview({ requirement, onClose, onApprove, onReject }: ManualReviewProps) {
  const [comment, setComment] = useState('');

  if (!requirement) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
          <Icon name="MousePointerClick" size={20} className="text-slate-400" />
        </div>
        <p className="text-sm">Выберите требование из списка слева для ручной проверки</p>
      </div>
    );
  }

  const statusColor = {
    match: 'text-green-600',
    partial: 'text-yellow-600',
    new: 'text-blue-600',
    conflict: 'text-red-600',
  }[requirement.status] || 'text-slate-600';

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <span className="font-mono text-xs font-medium text-muted-foreground">{requirement.code}</span>
          <h3 className="text-base font-semibold text-[hsl(var(--almi-navy))] mt-0.5">Ручная верификация</h3>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-md transition-colors">
          <Icon name="X" size={16} className="text-muted-foreground" />
        </button>
      </div>

      <div className="bg-slate-50 rounded-lg p-4 border border-border">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Новое требование</p>
        <p className="text-sm leading-relaxed text-foreground">
          {requirement.requirement_text.split(' ').map((word, i) => (
            i % 6 === 3
              ? <mark key={i} className="highlight-req rounded px-0.5">{word} </mark>
              : <span key={i}>{word} </span>
          ))}
        </p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Icon name="FileText" size={12} />
            {requirement.source_file}
          </span>
          {requirement.component && (
            <span className="flex items-center gap-1">
              <Icon name="Tag" size={12} />
              {requirement.component}
            </span>
          )}
        </div>
      </div>

      {requirement.matched_db_id && (
        <div className="bg-white rounded-lg p-4 border border-border">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Совпадение в базе</p>
          <div className="flex items-start gap-3">
            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-[hsl(var(--almi-slate))] shrink-0">
              #{requirement.matched_db_id}
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {requirement.matched_text || 'Требование из накопленной базы'}
            </p>
          </div>
          {requirement.matched_group && (
            <div className="mt-2">
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded">
                {requirement.matched_group}
              </span>
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <span className={`text-sm font-bold font-mono ${statusColor}`}>{requirement.match_percent}%</span>
            <span className="text-xs text-muted-foreground">совпадение</span>
          </div>
        </div>
      )}

      {requirement.analyst_comment && (
        <div className="flex gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <Icon name="AlertTriangle" size={15} className="shrink-0 mt-0.5" />
          <span>{requirement.analyst_comment}</span>
        </div>
      )}

      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
          Комментарий аналитика
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Введите обоснование решения..."
          rows={3}
          className="w-full text-sm border border-border rounded-md px-3 py-2 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--almi-blue))]/30 focus:border-[hsl(var(--almi-blue))]"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => { onApprove(String(requirement.id), comment); setComment(''); }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[hsl(var(--almi-navy))] text-white text-sm font-semibold rounded-md hover:bg-[hsl(214,72%,18%)] transition-colors"
        >
          <Icon name="CheckCheck" size={15} />
          Подтвердить
        </button>
        <button
          onClick={() => { onReject(String(requirement.id), comment); setComment(''); }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-red-200 text-red-600 text-sm font-semibold rounded-md hover:bg-red-50 transition-colors"
        >
          <Icon name="XCircle" size={15} />
          Отклонить
        </button>
      </div>
    </div>
  );
}
