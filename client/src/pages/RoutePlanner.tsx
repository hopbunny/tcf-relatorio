import { useState, useRef, useCallback } from 'react';
import {
  Upload, Map, Sparkles, Loader2, AlertCircle, CheckCircle2,
  Clock, ListOrdered, Download, RotateCcw, Info, Flag,
  ChevronDown, ChevronUp, Zap
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RoutePoint {
  id: string;
  label: string;
  color: string;
  priority: number;
  notes: string;
}

interface AnalysisResult {
  success: boolean;
  colorMapping: Record<string, string>;
  points: RoutePoint[];
  optimizedRoute: string[];
  routeDescription: string;
  totalPoints: number;
  estimatedTime: string;
  recommendations: string[];
  error?: string;
}

const PRIORITY_CONFIG: Record<number, { label: string; className: string; icon: string }> = {
  1: { label: 'Alta Prioridade', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800', icon: '🔴' },
  2: { label: 'Média Prioridade', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800', icon: '🟡' },
  3: { label: 'Baixa Prioridade', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', icon: '🟢' },
};

const COLOR_EMOJI: Record<string, string> = {
  red: '🔴', vermelho: '🔴',
  yellow: '🟡', amarelo: '🟡', orange: '🟠', laranja: '🟠',
  green: '🟢', verde: '🟢',
  blue: '🔵', azul: '🔵',
  purple: '🟣', roxo: '🟣',
  white: '⚪', branco: '⚪',
  black: '⚫', preto: '⚫',
};

function getColorEmoji(color: string): string {
  const lower = color.toLowerCase();
  for (const [key, emoji] of Object.entries(COLOR_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return '📍';
}

export default function RoutePlanner() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFullRoute, setShowFullRoute] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.route.uploadImage.useMutation();
  const analyzeMutation = trpc.route.analyzeMap.useMutation();

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem (PNG, JPG, WEBP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 10MB');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setAnalysisResult(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleAnalyze = async () => {
    if (!imageFile || !imagePreview) {
      toast.error('Selecione uma imagem do mapa primeiro');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Convert to base64 and upload
      const base64 = imagePreview.split(',')[1];
      const mimeType = imageFile.type;

      toast.info('Enviando imagem para análise...');
      const uploadResult = await uploadMutation.mutateAsync({ base64, mimeType });

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error('Falha ao fazer upload da imagem');
      }

      toast.info('IA analisando o mapa...');
      const result = await analyzeMutation.mutateAsync({
        imageUrl: uploadResult.url,
        name: `Análise - ${new Date().toLocaleDateString('pt-BR')}`,
      });

      setAnalysisResult(result as AnalysisResult);

      if (result.success) {
        toast.success(`Análise concluída! ${result.totalPoints} pontos identificados.`);
      } else {
        toast.error(result.error || 'Erro na análise');
      }
    } catch (err: any) {
      toast.error('Erro ao analisar o mapa. Tente novamente.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Build ordered route from analysis
  const orderedPoints = analysisResult?.points
    ? [...analysisResult.points].sort((a, b) => a.priority - b.priority)
    : [];

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-full">
        {/* Page Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Map className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  Otimizador de Rotas
                  <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/30 bg-primary/5 gap-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    IA
                  </Badge>
                </h1>
                <p className="text-sm text-muted-foreground">Envie um print do mapa e a IA monta a rota otimizada</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 py-6">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* How it works */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { step: '1', icon: <Upload className="h-4 w-4" />, title: 'Envie o mapa', desc: 'Faça upload de um print do mapa com os pontos marcados' },
                { step: '2', icon: <Sparkles className="h-4 w-4" />, title: 'IA analisa', desc: 'A IA identifica as cores, pontos e prioridades automaticamente' },
                { step: '3', icon: <ListOrdered className="h-4 w-4" />, title: 'Rota otimizada', desc: 'Receba a lista ordenada por prioridade e a rota sugerida' },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      {item.icon}
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* TCF Color Legend */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-foreground text-sm">Legenda de Cores — Padrão TCF Telecom</h2>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { color: 'bg-red-500', label: 'Vermelho', desc: 'Urgência', sub: 'Manutenção / Desconectado', priority: 1 },
                  { color: 'bg-purple-500', label: 'Roxo', desc: 'Pendente', sub: 'Aguardando execução', priority: 2 },
                  { color: 'bg-gray-400', label: 'Cinza', desc: 'Migração', sub: 'Troca de plano/equip.', priority: 3 },
                  { color: 'bg-blue-500', label: 'Azul', desc: 'Instalação', sub: 'Novo cliente', priority: 4 },
                  { color: 'bg-green-500', label: 'Verde', desc: 'Reservado', sub: 'Visita agendada', priority: 5 },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/40 border border-border">
                    <div className={`w-4 h-4 rounded-full ${item.color} flex-shrink-0 mt-0.5 shadow-sm`} />
                    <div>
                      <p className="text-xs font-bold text-foreground">{item.label}</p>
                      <p className="text-xs font-medium text-foreground/80">{item.desc}</p>
                      <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                      <span className="text-[10px] font-bold text-primary">Prioridade {item.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Area */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  Upload do Mapa
                </h2>
              </div>

              <div className="p-5">
                {!imagePreview ? (
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer",
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/30"
                    )}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Map className="h-7 w-7 text-primary" />
                    </div>
                    <p className="font-semibold text-foreground mb-1">
                      Arraste o print do mapa aqui
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      ou clique para selecionar o arquivo
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Suporta PNG, JPG, WEBP — máx. 10MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden border border-border">
                      <img
                        src={imagePreview}
                        alt="Mapa para análise"
                        className="w-full max-h-80 object-contain bg-muted/20"
                      />
                      <div className="absolute top-3 right-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReset}
                          className="gap-1.5 bg-card/90 backdrop-blur-sm text-xs h-7"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Trocar
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{imageFile?.name}</span>
                        {' '}({((imageFile?.size || 0) / 1024).toFixed(0)}KB)
                      </p>
                      <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analisando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Analisar com IA
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Loading State */}
            {isAnalyzing && (
              <div className="bg-card border border-primary/20 rounded-xl p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="h-7 w-7 text-primary animate-spin" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Analisando o mapa...</h3>
                <p className="text-sm text-muted-foreground">
                  A IA está identificando os pontos, cores e calculando a rota otimizada.
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  {['Identificando cores', 'Mapeando pontos', 'Calculando rota'].map((step, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      {step}
                      {i < 2 && <span className="mx-1">→</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Results */}
            {analysisResult && !isAnalyzing && (
              <div className="space-y-5">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{analysisResult.totalPoints}</p>
                    <p className="text-xs text-muted-foreground mt-1">Pontos Identificados</p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-accent">{analysisResult.estimatedTime || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground mt-1">Tempo Estimado</p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {analysisResult.points.filter(p => p.priority === 1).length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Alta Prioridade</p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {analysisResult.points.filter(p => p.priority >= 3).length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Baixa Prioridade</p>
                  </div>
                </div>

                {/* Color Legend */}
                {Object.keys(analysisResult.colorMapping).length > 0 && (
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-border">
                      <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        Legenda de Cores Identificadas
                      </h3>
                    </div>
                    <div className="p-4 flex flex-wrap gap-2">
                      {Object.entries(analysisResult.colorMapping).map(([color, label]) => (
                        <div key={color} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-sm">
                          <span className="text-base">{getColorEmoji(color)}</span>
                          <span className="font-medium text-foreground">{label}</span>
                          <span className="text-xs text-muted-foreground">({color})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optimized Route */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      <ListOrdered className="h-4 w-4 text-primary" />
                      Rota Otimizada — Lista de Visitas
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFullRoute(!showFullRoute)}
                      className="h-7 text-xs gap-1"
                    >
                      {showFullRoute ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {showFullRoute ? 'Recolher' : 'Expandir'}
                    </Button>
                  </div>

                  {showFullRoute && (
                    <div className="divide-y divide-border">
                      {orderedPoints.map((point, idx) => {
                        const priorityConfig = PRIORITY_CONFIG[point.priority] || PRIORITY_CONFIG[3];
                        return (
                          <div key={point.id} className="px-5 py-4 flex items-start gap-4 hover:bg-muted/20 transition-colors">
                            {/* Order number */}
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-sm">
                              {idx + 1}
                            </div>

                            {/* Point info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-semibold text-foreground">{point.label}</span>
                                <span className="text-base">{getColorEmoji(point.color)}</span>
                                <span className={cn(
                                  'text-xs px-2 py-0.5 rounded-full font-medium border',
                                  priorityConfig.className
                                )}>
                                  {priorityConfig.label}
                                </span>
                              </div>
                              {point.notes && (
                                <p className="text-xs text-muted-foreground">{point.notes}</p>
                              )}
                            </div>

                            {/* Priority indicator */}
                            <div className="flex-shrink-0">
                              {point.priority === 1 && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                              {point.priority === 2 && (
                                <Clock className="h-4 w-4 text-amber-500" />
                              )}
                              {point.priority >= 3 && (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Route Description */}
                {analysisResult.routeDescription && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                    <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                      <Zap className="h-4 w-4 text-primary" />
                      Estratégia de Rota
                    </h3>
                    <p className="text-sm text-foreground leading-relaxed">
                      {analysisResult.routeDescription}
                    </p>
                  </div>
                )}

                {/* Recommendations */}
                {analysisResult.recommendations.length > 0 && (
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-border">
                      <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                        <Flag className="h-4 w-4 text-accent" />
                        Recomendações da IA
                      </h3>
                    </div>
                    <div className="p-4 space-y-2">
                      {analysisResult.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                          <span className="text-foreground">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Analysis Button */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Analisar Novo Mapa
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
