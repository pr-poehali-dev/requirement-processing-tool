import { useState } from 'react';
import { Requirement, RequirementStatus, COMPONENTS } from '@/data/mockData';
import Icon from '@/components/ui/icon';

interface ResultsTableProps {
  requirements: Requirement[];
  onSelect: (req: Requirement) => void;
}

const STATUS_LABELS: Record<RequirementStatus, string> = {
  match: 'Совпадает',
  partial: 'Частично',
  new: 'Новое',
  conflict: 'Конфликт',
};

const STATUS_CLASS: Record<RequirementStatus, string> = {
  match: 'status-match',
  partial: 'status-partial',
  new: 'status-new',
  conflict: 'status-conflict',
};

const STATUS_ICON: Record<RequirementStatus, string> = {
  match: 'CheckCircle2',
  partial: 'AlertCircle',
  new: 'PlusCircle',
  conflict: 'XCircle',
};

export default function ResultsTable({ requirements, onSelect }: ResultsTableProps) {
  const [filterStatus, setFilterStatus] = useState<RequirementStatus | 'all'>('all');
  const [filterComponent, setFilterComponent] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = requirements.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterComponent !== 'all' && r.component !== filterComponent) return false;
    if (search && !r.text.toLowerCase().includes(search.toLowerCase()) && !r.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: requirements.length,
    match: requirements.filter(r => r.status === 'match').length,
    partial: requirements.filter(r => r.status === 'partial').length,
    new: requirements.filter(r => r.status === 'new').length,
    conflict: requirements.filter(r => r.status === 'conflict').length,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        {(['all', 'match', 'partial', 'new', 'conflict'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`p-3 rounded-lg border text-left transition-all duration-150
              ${filterStatus === s
                ? 'border-[hsl(var(--almi-blue))] bg-sky-50 shadow-sm'
                : 'border-border bg-white hover:border-slate-300'
              }`}
          >
            <div className="text-2xl font-bold font-mono text-[hsl(var(--almi-navy))]">
              {counts[s]}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {s === 'all' ? 'Всего' : STATUS_LABELS[s]}
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по тексту или коду требования..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--almi-blue))]/30 focus:border-[hsl(var(--almi-blue))]"
          />
        </div>
        <select
          value={filterComponent}
          onChange={e => setFilterComponent(e.target.value)}
          className="text-sm border border-border rounded-md bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--almi-blue))]/30 text-foreground"
        >
          <option value="all">Все компоненты</option>
          {COMPONENTS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="rounded-lg border border-border overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-border">
              <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--almi-navy))] text-xs uppercase tracking-wide w-24">Код</th>
              <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--almi-navy))] text-xs uppercase tracking-wide">Требование</th>
              <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--almi-navy))] text-xs uppercase tracking-wide w-40">Компонент</th>
              <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--almi-navy))] text-xs uppercase tracking-wide w-28">Статус</th>
              <th className="text-left px-4 py-3 font-semibold text-[hsl(var(--almi-navy))] text-xs uppercase tracking-wide w-28">Совпадение</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-muted-foreground">Нет требований по выбранным фильтрам</td>
              </tr>
            )}
            {filtered.map((req, i) => (
              <tr
                key={req.id}
                onClick={() => onSelect(req)}
                className="hover:bg-slate-50/70 cursor-pointer transition-colors duration-100 group animate-fade-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <td className="px-4 py-3">
                  <span className="font-mono-ibm text-xs font-medium text-[hsl(var(--almi-slate))]">{req.code}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-foreground leading-snug line-clamp-2">{req.text}</p>
                  {req.comment && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{req.comment}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-slate-100 text-slate-600 rounded px-2 py-1">{req.component}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium rounded px-2 py-1 ${STATUS_CLASS[req.status]}`}>
                    <Icon name={STATUS_ICON[req.status]} size={12} />
                    {STATUS_LABELS[req.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500
                          ${req.matchPercent >= 90 ? 'bg-green-500' :
                            req.matchPercent >= 60 ? 'bg-yellow-500' :
                            req.matchPercent > 0 ? 'bg-blue-400' : 'bg-slate-300'}`}
                        style={{ width: `${req.matchPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-semibold w-8 text-right text-[hsl(var(--almi-navy))]">
                      {req.matchPercent}%
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <Icon name="ChevronRight" size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
