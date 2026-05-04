import { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { readFileAsText, readFileAsBase64, extractRequirementsFromText, uploadAndAnalyze, AnalysisResult } from '@/api/client';

interface UploadSectionProps {
  onAnalyzed: (results: AnalysisResult[], sessionId: number, fileName: string) => void;
}

const ACCEPTED = ['.pdf', '.docx', '.odt', '.xlsx', '.ods', '.txt', '.csv'];

type Step = 'idle' | 'reading' | 'uploading' | 'analyzing' | 'done' | 'error';

const STEPS = [
  { key: 'reading', label: 'Чтение и извлечение текста из документа' },
  { key: 'uploading', label: 'Загрузка файла в хранилище' },
  { key: 'analyzing', label: 'Семантическое сравнение с базой требований' },
  { key: 'done', label: 'Формирование результатов анализа' },
];

export default function UploadSection({ onAnalyzed }: UploadSectionProps) {
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState<Step>('idle');
  const [currentFile, setCurrentFile] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [reqCount, setReqCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
  };

  const processFiles = async (files: File[]) => {
    const valid = files.filter(f => ACCEPTED.some(ext => f.name.toLowerCase().endsWith(ext)));
    if (!valid.length) {
      setError('Неподдерживаемый формат файла.');
      return;
    }
    const file = valid[0];
    setCurrentFile(file.name);
    setError('');

    try {
      setStep('reading');
      const text = await readFileAsText(file);
      const reqs = extractRequirementsFromText(text);
      setReqCount(reqs.length);

      setStep('uploading');
      const b64 = await readFileAsBase64(file);

      setStep('analyzing');
      const result = await uploadAndAnalyze(file.name, reqs, b64);

      setStep('done');
      setTimeout(() => {
        onAnalyzed(result.results, result.session_id, file.name);
        setStep('idle');
        setCurrentFile('');
      }, 800);
    } catch (e) {
      setStep('error');
      setError('Ошибка при анализе. Попробуйте ещё раз.');
    }
  };

  const isProcessing = step !== 'idle' && step !== 'error';
  const currentStepIdx = STEPS.findIndex(s => s.key === step);

  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return 'FileText';
    if (name.endsWith('.xlsx') || name.endsWith('.ods') || name.endsWith('.csv')) return 'FileSpreadsheet';
    return 'File';
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => !isProcessing && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        className={`relative border-2 border-dashed rounded-lg p-10 text-center transition-all duration-200 select-none
          ${isProcessing ? 'cursor-default opacity-70' : 'cursor-pointer'}
          ${dragging
            ? 'border-[hsl(var(--accent))] bg-sky-50 scale-[1.01]'
            : 'border-[hsl(var(--border))] bg-white hover:border-[hsl(var(--almi-blue))] hover:bg-sky-50/50'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={handleChange}
        />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-200
            ${dragging ? 'bg-sky-100' : 'bg-slate-100'}`}>
            <Icon name="Upload" size={26} className={dragging ? 'text-sky-500' : 'text-slate-400'} />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[hsl(var(--almi-navy))]">
              {isProcessing ? `Обрабатываем: ${currentFile}` : 'Перетащите файлы или нажмите для выбора'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Поддерживаемые форматы: PDF, DOCX, ODT, XLSX, ODS, TXT, CSV
            </p>
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="bg-white rounded-lg border border-border p-5 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <svg className="animate-spin w-5 h-5 text-[hsl(var(--almi-blue))] shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <div>
              <p className="text-sm font-semibold text-[hsl(var(--almi-navy))]">Анализируем требования...</p>
              {reqCount > 0 && (
                <p className="text-xs text-muted-foreground">Извлечено {reqCount} требований</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  i < currentStepIdx ? 'bg-green-500' :
                  i === currentStepIdx ? 'bg-[hsl(var(--almi-blue))] animate-pulse' :
                  'bg-slate-200'
                }`} />
                <span className={`${i < currentStepIdx ? 'line-through text-muted-foreground/60' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 animate-fade-in">
          <Icon name="AlertCircle" size={15} className="shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto">
            <Icon name="X" size={14} />
          </button>
        </div>
      )}

      {step === 'idle' && currentFile && (
        <div className="flex items-center justify-between bg-white border border-border rounded-md px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Icon name={getFileIcon(currentFile)} size={16} className="text-[hsl(var(--almi-blue))]" />
            <span className="text-sm font-medium text-foreground">{currentFile}</span>
          </div>
          <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-0.5 font-medium">
            Анализ завершён
          </span>
        </div>
      )}
    </div>
  );
}
