import { useState } from 'react';
import { DBRequirement, mockDBRequirements, COMPONENTS } from '@/data/mockData';
import Icon from '@/components/ui/icon';

export default function RequirementsDB() {
  const [activeComponent, setActiveComponent] = useState<string>(COMPONENTS[0]);
  const [search, setSearch] = useState('');

  const filtered = mockDBRequirements.filter(r =>
    r.component === activeComponent &&
    (search === '' || r.text.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase()))
  );

  const componentCount = (comp: string) => mockDBRequirements.filter(r => r.component === comp).length;

  return (
    <div className="flex gap-5 h-[420px]">
      <div className="w-52 shrink-0 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Компоненты</p>
        {COMPONENTS.map(comp => (
          <button
            key={comp}
            onClick={() => setActiveComponent(comp)}
            className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-all duration-150 flex items-center justify-between group
              ${activeComponent === comp
                ? 'bg-[hsl(var(--almi-navy))] text-white'
                : 'text-foreground hover:bg-slate-100'
              }`}
          >
            <span className="leading-tight">{comp}</span>
            <span className={`text-xs font-mono font-semibold rounded px-1.5 py-0.5
              ${activeComponent === comp ? 'bg-white/20 text-white' : 'bg-slate-100 text-muted-foreground'}`}>
              {componentCount(comp)}
            </span>
          </button>
        ))}
        <div className="pt-3 border-t border-border mt-3">
          <div className="text-xs text-muted-foreground">
            Всего в базе:
            <span className="font-bold text-[hsl(var(--almi-navy))] ml-1">{mockDBRequirements.length}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Поиск в «${activeComponent}»...`}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--almi-blue))]/30 focus:border-[hsl(var(--almi-blue))]"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-border bg-white rounded-md hover:bg-slate-50 transition-colors text-foreground">
            <Icon name="Plus" size={14} />
            Добавить
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filtered.length === 0 && (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Нет требований по запросу
            </div>
          )}
          {filtered.map((req, i) => (
            <div
              key={req.id}
              className="bg-white border border-border rounded-lg p-4 hover:border-[hsl(var(--almi-blue))]/40 hover:shadow-sm transition-all duration-150 animate-fade-in group"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-semibold text-[hsl(var(--almi-slate))] bg-slate-100 px-2 py-0.5 rounded">
                      {req.code}
                    </span>
                    <span className="text-xs text-muted-foreground">v{req.version}</span>
                    <span className="text-xs text-muted-foreground">· {req.addedDate}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{req.text}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button className="p-1.5 hover:bg-slate-100 rounded transition-colors">
                    <Icon name="Pencil" size={13} className="text-muted-foreground" />
                  </button>
                  <button className="p-1.5 hover:bg-red-50 rounded transition-colors">
                    <Icon name="Trash2" size={13} className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
