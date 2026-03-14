import { useState, useEffect } from 'react';
import { Plus, Trash2, Sparkles, Loader2, ChevronDown, X, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SERVICE_TYPES = [
  'Instalação',
  'Manutenção',
  'Reparo',
  'Suporte Técnico',
  'Diagnóstico',
  'Atualização de Firmware',
  'Troca de Equipamento',
  'Visita Técnica',
  'Outro',
];

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

interface AISuggestions {
  descriptions: string[];
  procedures: string[];
  observations: string[];
}

export default function ServiceModal({ isOpen, onClose, onSubmit }: ServiceModalProps) {
  const [clientCode, setClientCode] = useState('');
  const [clientName, setClientName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [procedures, setProcedures] = useState<string[]>(['']);
  const [analysis, setAnalysis] = useState('');
  const [observations, setObservations] = useState<string[]>(['']);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'done'>('done');

  // AI state
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [improvingField, setImprovingField] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<Record<string, boolean>>({});

  const getSuggestionsMutation = trpc.ai.getSuggestions.useMutation();
  const learnMutation = trpc.ai.learn.useMutation();
  const improveTextMutation = trpc.ai.improveText.useMutation();

  // Load AI suggestions when service type changes
  useEffect(() => {
    if (serviceType && isOpen) {
      setLoadingSuggestions(true);
      getSuggestionsMutation.mutateAsync({ serviceType })
        .then(data => {
          setAiSuggestions(data as AISuggestions);
        })
        .catch(() => {})
        .finally(() => setLoadingSuggestions(false));
    }
  }, [serviceType, isOpen]);

  const handleReset = () => {
    setClientCode('');
    setClientName('');
    setServiceType('');
    setDescription('');
    setProcedures(['']);
    setAnalysis('');
    setObservations(['']);
    setAiSuggestions(null);
    setShowSuggestions({});
    setStartTime('');
    setEndTime('');
    setStatus('done');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!clientCode.trim()) { toast.error('Informe o código do cliente'); return; }
    if (!clientName.trim()) { toast.error('Informe o nome do cliente'); return; }
    if (!serviceType) { toast.error('Selecione o tipo de serviço'); return; }

    const validProcedures = procedures.filter(p => p.trim());
    const validObservations = observations.filter(o => o.trim());

    // Learn from this submission
    if (serviceType) {
      if (description.trim()) {
        learnMutation.mutate({ serviceType, field: 'description', content: description.trim() });
      }
      validProcedures.forEach(p => {
        learnMutation.mutate({ serviceType, field: 'procedure', content: p.trim() });
      });
      validObservations.forEach(o => {
        learnMutation.mutate({ serviceType, field: 'observation', content: o.trim() });
      });
    }

    onSubmit({
      clientCode: clientCode.trim(),
      clientName: clientName.trim(),
      serviceType,
      description: description.trim(),
      procedures: validProcedures,
      analysis: analysis.trim(),
      observations: validObservations,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      status,
    });

    handleReset();
  };

  const handleImproveText = async (
    field: 'description' | 'procedure' | 'observation' | 'analysis',
    text: string,
    index?: number
  ) => {
    if (!text.trim()) { toast.error('Digite algo antes de melhorar'); return; }
    const key = index !== undefined ? `${field}-${index}` : field;
    setImprovingField(key);
    try {
      const result = await improveTextMutation.mutateAsync({ text, type: field });
      if (field === 'description') setDescription(result.improved);
      else if (field === 'analysis') setAnalysis(result.improved);
      else if (field === 'procedure' && index !== undefined) {
        const updated = [...procedures];
        updated[index] = result.improved;
        setProcedures(updated);
      } else if (field === 'observation' && index !== undefined) {
        const updated = [...observations];
        updated[index] = result.improved;
        setObservations(updated);
      }
      toast.success('Texto melhorado pela IA!');
    } catch {
      toast.error('Erro ao melhorar o texto');
    } finally {
      setImprovingField(null);
    }
  };

  const addProcedure = () => setProcedures([...procedures, '']);
  const removeProcedure = (i: number) => {
    if (procedures.length === 1) return;
    setProcedures(procedures.filter((_, idx) => idx !== i));
  };
  const updateProcedure = (i: number, val: string) => {
    const updated = [...procedures];
    updated[i] = val;
    setProcedures(updated);
  };

  const addObservation = () => setObservations([...observations, '']);
  const removeObservation = (i: number) => {
    if (observations.length === 1) return;
    setObservations(observations.filter((_, idx) => idx !== i));
  };
  const updateObservation = (i: number, val: string) => {
    const updated = [...observations];
    updated[i] = val;
    setObservations(updated);
  };

  const toggleSuggestions = (key: string) => {
    setShowSuggestions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const SuggestionChips = ({
    suggestions,
    onSelect,
    fieldKey,
  }: {
    suggestions: string[];
    onSelect: (s: string) => void;
    fieldKey: string;
  }) => {
    if (!suggestions.length) return null;
    return (
      <div className="mt-1.5">
        <button
          type="button"
          onClick={() => toggleSuggestions(fieldKey)}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <Sparkles className="h-3 w-3" />
          {suggestions.length === 1 ? '1 sugestão' : `${suggestions.length} sugestões`} da IA
          <ChevronDown className={cn("h-3 w-3 transition-transform", showSuggestions[fieldKey] && "rotate-180")} />
        </button>
        {showSuggestions[fieldKey] && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { onSelect(s); toggleSuggestions(fieldKey); }}
                className="text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg px-2.5 py-1 transition-colors text-left max-w-full"
              >
                {s.length > 60 ? s.substring(0, 60) + '...' : s}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            Registrar Serviço
            {loadingSuggestions && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground font-normal ml-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Carregando sugestões da IA...
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Client Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Código do Cliente *
              </Label>
              <Input
                placeholder="Ex: 12345"
                value={clientCode}
                onChange={e => setClientCode(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Nome do Cliente *
              </Label>
              <Input
                placeholder="Nome completo"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
              />
            </div>
          </div>

          {/* Time & Status Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Início
              </Label>
              <Input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Fim
              </Label>
              <Input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Status
              </Label>
              <Select value={status} onValueChange={(v) => setStatus(v as 'pending' | 'in_progress' | 'done')}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="done">✅ Concluído</SelectItem>
                  <SelectItem value="in_progress">🔄 Em Andamento</SelectItem>
                  <SelectItem value="pending">⏳ Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Service Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Tipo de Serviço *
            </Label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de serviço" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {serviceType && aiSuggestions && (
              <p className="text-xs text-primary flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                IA pronta com {aiSuggestions.descriptions.length + aiSuggestions.procedures.length + aiSuggestions.observations.length} sugestões para {serviceType}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Descrição da Ocorrência
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleImproveText('description', description)}
                disabled={!description.trim() || improvingField === 'description'}
                className="h-6 text-xs gap-1 text-primary hover:text-primary"
              >
                {improvingField === 'description' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Wand2 className="h-3 w-3" />
                )}
                Melhorar com IA
              </Button>
            </div>
            <Textarea
              placeholder="Descreva o motivo da visita, problema relatado ou tipo de instalação..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
            {aiSuggestions && (
              <SuggestionChips
                suggestions={aiSuggestions.descriptions}
                onSelect={setDescription}
                fieldKey="description"
              />
            )}
          </div>

          {/* Procedures */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Procedimentos Realizados
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addProcedure}
                className="h-6 text-xs gap-1 text-primary"
              >
                <Plus className="h-3 w-3" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-2">
              {procedures.map((proc, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex gap-2 items-start">
                    <span className="text-xs text-muted-foreground font-mono mt-2.5 w-4 flex-shrink-0">{i + 1}.</span>
                    <div className="flex-1 relative">
                      <Input
                        placeholder={`Procedimento ${i + 1}...`}
                        value={proc}
                        onChange={e => updateProcedure(i, e.target.value)}
                        className="pr-16 text-sm"
                      />
                      <div className="absolute right-1 top-1 flex gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleImproveText('procedure', proc, i)}
                          disabled={!proc.trim() || improvingField === `procedure-${i}`}
                          title="Melhorar com IA"
                        >
                          {improvingField === `procedure-${i}` ? (
                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          ) : (
                            <Wand2 className="h-3 w-3 text-primary" />
                          )}
                        </Button>
                        {procedures.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => removeProcedure(i)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {i === 0 && aiSuggestions && (
                    <div className="ml-6">
                      <SuggestionChips
                        suggestions={aiSuggestions.procedures}
                        onSelect={(s) => updateProcedure(i, s)}
                        fieldKey={`procedure-${i}`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Analysis */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Análise Técnica
                <span className="ml-1 text-muted-foreground font-normal normal-case">(opcional)</span>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleImproveText('analysis', analysis)}
                disabled={!analysis.trim() || improvingField === 'analysis'}
                className="h-6 text-xs gap-1 text-primary hover:text-primary"
              >
                {improvingField === 'analysis' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Wand2 className="h-3 w-3" />
                )}
                Melhorar com IA
              </Button>
            </div>
            <Textarea
              placeholder="Dificuldades encontradas, ajustes realizados, padrão fora da normalidade..."
              value={analysis}
              onChange={e => setAnalysis(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          {/* Observations */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Observações
                <span className="ml-1 text-muted-foreground font-normal normal-case">(opcional)</span>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addObservation}
                className="h-6 text-xs gap-1 text-primary"
              >
                <Plus className="h-3 w-3" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-2">
              {observations.map((obs, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex gap-2 items-start">
                    <span className="text-xs text-muted-foreground font-mono mt-2.5 w-4 flex-shrink-0">{i + 1}.</span>
                    <div className="flex-1 relative">
                      <Input
                        placeholder={`Observação ${i + 1}...`}
                        value={obs}
                        onChange={e => updateObservation(i, e.target.value)}
                        className="pr-16 text-sm"
                      />
                      <div className="absolute right-1 top-1 flex gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleImproveText('observation', obs, i)}
                          disabled={!obs.trim() || improvingField === `observation-${i}`}
                          title="Melhorar com IA"
                        >
                          {improvingField === `observation-${i}` ? (
                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          ) : (
                            <Wand2 className="h-3 w-3 text-primary" />
                          )}
                        </Button>
                        {observations.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => removeObservation(i)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {i === 0 && aiSuggestions && (
                    <div className="ml-6">
                      <SuggestionChips
                        suggestions={aiSuggestions.observations}
                        onSelect={(s) => updateObservation(i, s)}
                        fieldKey={`observation-${i}`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Salvar Serviço
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
