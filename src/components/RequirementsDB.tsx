import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRequirements, createRequirement, importRequirementsFile, readFileAsBase64, DBRequirementAPI } from '@/api/client';
import Icon from '@/components/ui/icon';

interface ReqFormData {
  product: string;
  requirement_group: string;
  requirement: string;
  synonyms: string;
  presence: string;
  risk_comment: string;
  moi_office: string;
  r7_office: string;
  proposed_wording: string;
  source: string;
  external_id: string;
  author: string;
  jira_link: string;
}

const EMPTY_FORM: ReqFormData = {
  product: '', requirement_group: '', requirement: '', synonyms: '',
  presence: '', risk_comment: '', moi_office: '', r7_office: '',
  proposed_wording: '', source: '', external_id: '', author: '', jira_link: '',
};

export default function RequirementsDB() {
  const [items, setItems] = useState<DBRequirementAPI[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [activeProduct, setActiveProduct] = useState<string>('');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ReqFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const importRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRequirements({
        product: activeProduct || undefined,
        search: search || undefined,
        limit: 100,
      });
      setItems(data.items);
      setTotal(data.total);
      setProducts(data.products);
      if (!activeProduct && data.products.length > 0) {
        setActiveProduct(data.products[0]);
      }
    } finally {
      setLoading(false);
    }
  }, [activeProduct, search]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.requirement.trim()) return;
    setSaving(true);
    await createRequirement(form);
    setForm(EMPTY_FORM);
    setShowForm(false);
    await load();
    setSaving(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    const b64 = await readFileAsBase64(file);
    const result = await importRequirementsFile(file.name, b64, importMode);
    setImportResult({ imported: result.imported, skipped: result.skipped });
    await load();
    setImporting(false);
    if (importRef.current) importRef.current.value = '';
  };

  const productCount = (p: string) => items.filter(r => r.product === p).length;

  return (
    <div className="flex gap-5 h-[520px]">
      <div className="w-52 shrink-0 flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Продукты</p>
        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-muted-foreground">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
        ) : products.length === 0 ? (
          <div className="text-xs text-muted-foreground italic p-2">База пока пуста</div>
        ) : (
          products.map(p => (
            <button
              key={p}
              onClick={() => setActiveProduct(p)}
              className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-all duration-150 flex items-center justify-between
                ${activeProduct === p
                  ? 'bg-[hsl(var(--almi-navy))] text-white'
                  : 'text-foreground hover:bg-slate-100'
                }`}
            >
              <span className="leading-tight truncate">{p || 'Без продукта'}</span>
              <span className={`text-xs font-mono font-semibold rounded px-1.5 py-0.5 shrink-0 ml-1
                ${activeProduct === p ? 'bg-white/20 text-white' : 'bg-slate-100 text-muted-foreground'}`}>
                {productCount(p)}
              </span>
            </button>
          ))
        )}
        <div className="pt-3 border-t border-border mt-auto">
          <div className="text-xs text-muted-foreground">
            Всего: <span className="font-bold text-[hsl(var(--almi-navy))] ml-1">{total}</span>
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
              placeholder="Поиск по тексту, синонимам, ИД..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--almi-blue))]/30 focus:border-[hsl(var(--almi-blue))]"
            />
          </div>
          <select
            value={activeProduct}
            onChange={e => setActiveProduct(e.target.value)}
            className="text-sm border border-border rounded-md bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--almi-blue))]/30 text-foreground"
          >
            <option value="">Все продукты</option>
            {products.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-[hsl(var(--almi-navy))] text-white rounded-md hover:bg-[hsl(214,72%,18%)] transition-colors"
          >
            <Icon name={showForm ? 'X' : 'Plus'} size={14} />
            {showForm ? 'Отмена' : 'Добавить'}
          </button>
          <button
            onClick={() => importRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-[hsl(var(--almi-blue))] text-[hsl(var(--almi-blue))] bg-white rounded-md hover:bg-sky-50 transition-colors disabled:opacity-60"
            title="Импортировать XLSX/CSV"
          >
            <Icon name={importing ? 'Loader' : 'FileUp'} size={14} className={importing ? 'animate-spin' : ''} />
            {importing ? 'Импорт...' : 'Импорт XLSX'}
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".xlsx,.xls,.csv,.tsv,.ods"
            className="hidden"
            onChange={handleImport}
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="radio"
              checked={importMode === 'append'}
              onChange={() => setImportMode('append')}
              className="accent-[hsl(var(--almi-navy))]"
            />
            Добавить к существующим
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="radio"
              checked={importMode === 'replace'}
              onChange={() => setImportMode('replace')}
              className="accent-red-500"
            />
            Заменить всю базу
          </label>
          {importResult && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-md animate-fade-in">
              <Icon name="CheckCircle2" size={13} />
              Импортировано: {importResult.imported} · Пропущено: {importResult.skipped}
            </div>
          )}
        </div>

        {showForm && (
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 space-y-3 animate-fade-in">
            <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--almi-navy))]">Новое требование</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: 'product', label: 'Продукт' },
                { key: 'requirement_group', label: 'Группа требований' },
                { key: 'external_id', label: 'ИД' },
                { key: 'author', label: 'Автор' },
                { key: 'source', label: 'Источник требования' },
                { key: 'jira_link', label: 'Ссылка на Jira' },
              ] as { key: keyof ReqFormData; label: string }[]).map(({ key, label }) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                  <input
                    value={form[key] as string}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full text-sm border border-border rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--almi-blue))]/30"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Требование *</label>
              <textarea
                value={form.requirement}
                onChange={e => setForm(f => ({ ...f, requirement: e.target.value }))}
                rows={2}
                className="w-full text-sm border border-border rounded-md px-3 py-1.5 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--almi-blue))]/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: 'synonyms', label: 'Синонимы' },
                { key: 'presence', label: 'Наличие' },
                { key: 'moi_office', label: 'Мой офис' },
                { key: 'r7_office', label: 'Р7 офис' },
                { key: 'risk_comment', label: 'Комментарий-риск' },
                { key: 'proposed_wording', label: 'Предлагаемая формулировка' },
              ] as { key: keyof ReqFormData; label: string }[]).map(({ key, label }) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                  <input
                    value={form[key] as string}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full text-sm border border-border rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--almi-blue))]/30"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !form.requirement.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--almi-navy))] text-white text-sm font-medium rounded-md hover:bg-[hsl(214,72%,18%)] disabled:opacity-50 transition-colors"
            >
              <Icon name={saving ? 'Loader' : 'Save'} size={14} className={saving ? 'animate-spin' : ''} />
              {saving ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading && (
            <div className="flex items-center justify-center h-24 text-muted-foreground gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span className="text-sm">Загрузка...</span>
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
              <Icon name="DatabaseZap" size={24} className="text-slate-300" />
              <p className="text-sm">
                {total === 0
                  ? 'База пуста — добавьте первое требование'
                  : 'Нет требований по фильтру'}
              </p>
            </div>
          )}
          {!loading && items.map((req, i) => (
            <div
              key={req.id}
              className="bg-white border border-border rounded-lg p-4 hover:border-[hsl(var(--almi-blue))]/40 hover:shadow-sm transition-all duration-150 animate-fade-in group"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {req.external_id && (
                      <span className="font-mono text-xs font-semibold text-[hsl(var(--almi-slate))] bg-slate-100 px-2 py-0.5 rounded">
                        {req.external_id}
                      </span>
                    )}
                    {req.requirement_group && (
                      <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded">
                        {req.requirement_group}
                      </span>
                    )}
                    {req.presence && (
                      <span className="text-xs text-muted-foreground">{req.presence}</span>
                    )}
                    {req.check_date && (
                      <span className="text-xs text-muted-foreground">· {req.check_date}</span>
                    )}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{req.requirement}</p>
                  {req.synonyms && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium">Синонимы:</span> {req.synonyms}
                    </p>
                  )}
                  {req.risk_comment && (
                    <p className="text-xs text-yellow-700 mt-1 flex items-start gap-1">
                      <Icon name="AlertTriangle" size={11} className="shrink-0 mt-0.5" />
                      {req.risk_comment}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {req.moi_office && <span className="text-xs text-muted-foreground">МО: {req.moi_office}</span>}
                    {req.r7_office && <span className="text-xs text-muted-foreground">Р7: {req.r7_office}</span>}
                    {req.jira_link && (
                      <a href={req.jira_link} target="_blank" rel="noreferrer"
                        className="text-xs text-[hsl(var(--almi-blue))] hover:underline flex items-center gap-1">
                        <Icon name="ExternalLink" size={11} />
                        Jira
                      </a>
                    )}
                    {req.author && <span className="text-xs text-muted-foreground">Автор: {req.author}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}