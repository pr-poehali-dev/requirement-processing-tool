import { useState } from 'react';
import { mockResults, Requirement } from '@/data/mockData';
import UploadSection from '@/components/UploadSection';
import ResultsTable from '@/components/ResultsTable';
import ManualReview from '@/components/ManualReview';
import RequirementsDB from '@/components/RequirementsDB';
import Icon from '@/components/ui/icon';

type Tab = 'upload' | 'results' | 'review' | 'database';

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: 'upload', label: 'Загрузка', icon: 'Upload' },
  { id: 'results', label: 'Результаты', icon: 'BarChart3' },
  { id: 'review', label: 'Проверка', icon: 'Eye' },
  { id: 'database', label: 'База требований', icon: 'Database' },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleUpload = (_fileName: string) => {
    setAnalyzing(true);
    setTimeout(() => {
      setRequirements(mockResults);
      setHasAnalyzed(true);
      setAnalyzing(false);
      setActiveTab('results');
    }, 2400);
  };

  const handleSelectReq = (req: Requirement) => {
    setSelectedReq(req);
    setActiveTab('review');
  };

  const handleApprove = (id: string, comment: string) => {
    setRequirements(prev => prev.map(r =>
      r.id === id ? { ...r, manualChecked: true, comment: comment || r.comment } : r
    ));
    setSelectedReq(null);
  };

  const handleReject = (id: string, comment: string) => {
    setRequirements(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'conflict', comment: comment || 'Отклонено аналитиком' } : r
    ));
    setSelectedReq(null);
  };

  const matchCount = requirements.filter(r => r.status === 'match').length;
  const totalCount = requirements.length;
  const matchRate = totalCount > 0 ? Math.round((matchCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-[hsl(var(--almi-light))] flex flex-col font-golos">
      <header className="almi-gradient text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-0">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/15 rounded-md flex items-center justify-center">
                  <Icon name="Layers" size={18} className="text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-[15px] tracking-tight leading-none">АЛМИ Партнер</div>
                  <div className="text-white/60 text-[11px] tracking-wide mt-0.5">Анализатор требований</div>
                </div>
              </div>
              <div className="w-px h-8 bg-white/20 mx-1" />
              <nav className="flex items-center gap-1">
                {NAV_ITEMS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150
                      ${activeTab === item.id
                        ? 'bg-white/15 text-white'
                        : 'text-white/65 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    <Icon name={item.icon} size={14} />
                    {item.label}
                    {item.id === 'results' && hasAnalyzed && (
                      <span className="bg-[hsl(var(--almi-blue))] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {requirements.length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {hasAnalyzed && (
                <div className="flex items-center gap-4 animate-fade-in">
                  <div className="text-right">
                    <div className="text-white/60 text-[10px] uppercase tracking-widest">Совпадений</div>
                    <div className="text-white font-bold text-lg font-mono leading-none">{matchRate}%</div>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="text-right">
                    <div className="text-white/60 text-[10px] uppercase tracking-widest">Требований</div>
                    <div className="text-white font-bold text-lg font-mono leading-none">{totalCount}</div>
                  </div>
                </div>
              )}
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-md transition-colors border border-white/20">
                <Icon name="Download" size={14} />
                Выгрузить XLSX
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto animate-slide-up">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[hsl(var(--almi-navy))]">Загрузка документации</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Загрузите файлы с требованиями — система автоматически извлечёт и сравнит их с накопленной базой
              </p>
            </div>

            <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
              <UploadSection onUpload={handleUpload} />
            </div>

            {analyzing && (
              <div className="mt-4 bg-white rounded-xl border border-border p-5 shadow-sm animate-fade-in">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
                    <svg className="animate-spin w-5 h-5 text-[hsl(var(--almi-blue))]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[hsl(var(--almi-navy))]">Анализируем требования...</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Сравниваем с накопленной базой по компонентам</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {['Извлечение требований из документа', 'Нормализация текста', 'Семантическое сравнение с базой', 'Формирование результатов'].map((step, i) => (
                    <div key={step} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className={`w-1.5 h-1.5 rounded-full ${i < 2 ? 'bg-green-500' : i === 2 ? 'bg-[hsl(var(--almi-blue))] animate-pulse' : 'bg-slate-200'}`} />
                      <span className={i < 2 ? 'line-through opacity-50' : ''}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!analyzing && (
              <div className="mt-6 grid grid-cols-3 gap-4">
                {[
                  { icon: 'Zap', title: 'Автоматическое сравнение', desc: 'Семантический поиск по всей базе требований' },
                  { icon: 'Shield', title: 'Выявление конфликтов', desc: 'Детектируем противоречия с принятыми решениями' },
                  { icon: 'FileOutput', title: 'XLSX-отчёт', desc: 'Полная документация анализа с комментариями' },
                ].map(card => (
                  <div key={card.title} className="bg-white rounded-lg border border-border p-4 shadow-sm">
                    <div className="w-8 h-8 rounded-md bg-sky-50 flex items-center justify-center mb-3">
                      <Icon name={card.icon} size={16} className="text-[hsl(var(--almi-blue))]" />
                    </div>
                    <p className="text-sm font-semibold text-[hsl(var(--almi-navy))]">{card.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-[hsl(var(--almi-navy))]">Результаты анализа</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {hasAnalyzed ? `Обработано ${totalCount} требований · нажмите на строку для ручной проверки` : 'Загрузите документы для анализа'}
                </p>
              </div>
              {hasAnalyzed && (
                <button className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--almi-navy))] text-white text-sm font-medium rounded-md hover:bg-[hsl(214,72%,18%)] transition-colors">
                  <Icon name="Download" size={14} />
                  Выгрузить XLSX
                </button>
              )}
            </div>
            {!hasAnalyzed ? (
              <div className="bg-white rounded-xl border border-border p-12 text-center">
                <Icon name="FileSearch" size={40} className="text-slate-300 mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">Перейдите в раздел «Загрузка» и загрузите документ с требованиями</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
                <ResultsTable requirements={requirements} onSelect={handleSelectReq} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'review' && (
          <div className="animate-slide-up">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-[hsl(var(--almi-navy))]">Ручная проверка</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Верификация требований аналитиком с комментариями</p>
            </div>
            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-1">
                <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">К проверке</p>
                  <div className="space-y-2">
                    {requirements.filter(r => !r.manualChecked && (r.status === 'partial' || r.status === 'conflict')).map(req => (
                      <button
                        key={req.id}
                        onClick={() => setSelectedReq(req)}
                        className={`w-full text-left p-3 rounded-lg border transition-all duration-150
                          ${selectedReq?.id === req.id
                            ? 'border-[hsl(var(--almi-blue))] bg-sky-50'
                            : 'border-border hover:border-slate-300 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs text-muted-foreground">{req.code}</span>
                          <span className={`text-xs font-medium ${req.status === 'conflict' ? 'text-red-600' : 'text-yellow-600'}`}>
                            {req.matchPercent}%
                          </span>
                        </div>
                        <p className="text-xs text-foreground line-clamp-2 leading-snug">{req.text}</p>
                      </button>
                    ))}
                    {requirements.filter(r => !r.manualChecked && (r.status === 'partial' || r.status === 'conflict')).length === 0 && (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        {hasAnalyzed ? 'Все требования проверены' : 'Сначала загрузите документ'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
                  <ManualReview
                    requirement={selectedReq}
                    onClose={() => setSelectedReq(null)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-[hsl(var(--almi-navy))]">База требований</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Накопленные требования по компонентам продукта</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--almi-navy))] text-white text-sm font-medium rounded-md hover:bg-[hsl(214,72%,18%)] transition-colors">
                <Icon name="Plus" size={14} />
                Добавить требование
              </button>
            </div>
            <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
              <RequirementsDB />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-white">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">© 2025 АЛМИ Партнер · Система анализа требований</span>
          <span className="text-xs text-muted-foreground font-mono">v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}
