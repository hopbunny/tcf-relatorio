import { useState } from 'react';
import { User, Calendar, UserCheck, ClipboardList, Plus, FileDown,
  Trash2, ChevronDown, ChevronUp, MoreVertical,
  CheckCircle2, AlertCircle, Clock, Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import ServiceModal from './ServiceModal';
import { Technician, Service, calcDuration } from '@/lib/types';
import { generatePDF } from '@/lib/pdf-generator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SERVICE_TYPE_COLORS: Record<string, string> = {
  'Instalação': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Manutenção': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Reparo': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Suporte Técnico': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Diagnóstico': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Atualização de Firmware': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Troca de Equipamento': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Visita Técnica': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Outro': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

interface TechnicianCardProps {
  technician: Technician;
  onDelete: (id: string) => void;
  onUpdate: (id: string, technician: Technician) => void;
}

export default function TechnicianCard({ technician, onDelete, onUpdate }: TechnicianCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const formattedDate = (() => {
    try {
      return new Date(technician.date + 'T12:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch {
      return technician.date;
    }
  })();

  const handleAddService = (serviceData: any) => {
    const newService: Service = {
      id: Date.now().toString(),
      ...serviceData,
      createdAt: new Date().toISOString(),
    };
    const updated = { ...technician, services: [...technician.services, newService] };
    onUpdate(technician.id, updated);
    setIsServiceModalOpen(false);
    toast.success('Serviço adicionado!');
  };

  const handleDeleteService = (serviceId: string) => {
    const updated = {
      ...technician,
      services: technician.services.filter(s => s.id !== serviceId),
    };
    onUpdate(technician.id, updated);
    toast.success('Serviço removido');
  };

  const handleGeneratePDF = async () => {
    if (technician.services.length === 0) {
      toast.error('Adicione pelo menos um serviço antes de gerar o relatório');
      return;
    }
    setGeneratingPDF(true);
    try {
      await generatePDF(technician);
      toast.success('Relatório PDF gerado!');
    } catch {
      toast.error('Erro ao gerar o relatório');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const serviceCount = technician.services.length;

  // Calcular tempo total trabalhado
  const totalMinutes = technician.services.reduce((acc, s) => {
    if (!s.startTime || !s.endTime) return acc;
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff > 0 ? acc + diff : acc;
  }, 0);
  const totalTimeStr = totalMinutes > 0
    ? (totalMinutes >= 60 ? `${Math.floor(totalMinutes/60)}h${totalMinutes%60 > 0 ? totalMinutes%60+'min' : ''}` : `${totalMinutes}min`)
    : null;

  // Contagem por status
  const doneCount = technician.services.filter(s => !s.status || s.status === 'done').length;
  const pendingCount = technician.services.filter(s => s.status === 'pending' || s.status === 'in_progress').length;

  return (
    <>
      <div className={cn(
        "bg-card border border-border rounded-xl overflow-hidden transition-all duration-200",
        "hover:shadow-md hover:border-primary/30",
        isExpanded && "shadow-md border-primary/20"
      )}>
        {/* Card Header */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-sm">
                {technician.technicianName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-foreground text-base leading-tight truncate">
                  {technician.technicianName}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <UserCheck className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{technician.responsibleName}</span>
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsServiceModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Serviço
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleGeneratePDF}
                  disabled={generatingPDF || serviceCount === 0}
                  className="gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  {generatingPDF ? 'Gerando...' : 'Gerar Relatório PDF'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => { onDelete(technician.id); toast.success('Técnico removido'); }}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir Técnico
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Info Row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <ClipboardList className="h-3 w-3" />
              {serviceCount} {serviceCount === 1 ? 'serviço' : 'serviços'}
            </span>
            {totalTimeStr && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Timer className="h-3 w-3" />
                {totalTimeStr}
              </span>
            )}
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Clock className="h-3 w-3" />
                {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsServiceModalOpen(true)}
              className="flex-1 gap-1.5 text-xs h-8"
            >
              <Plus className="h-3.5 w-3.5" />
              Serviço
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGeneratePDF}
              disabled={generatingPDF || serviceCount === 0}
              className="flex-1 gap-1.5 text-xs h-8"
            >
              <FileDown className="h-3.5 w-3.5" />
              {generatingPDF ? 'Gerando...' : 'PDF'}
            </Button>
            {serviceCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* Services List - Expandable */}
        {isExpanded && serviceCount > 0 && (
          <div className="border-t border-border">
            <div className="px-5 py-3 bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Serviços Registrados
              </p>
            </div>
            <div className="divide-y divide-border">
              {technician.services.map((service, idx) => (
                <ServiceItem
                  key={service.id}
                  service={service}
                  index={idx + 1}
                  onDelete={() => handleDeleteService(service.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {serviceCount === 0 && (
          <div className="px-5 pb-4">
            <div className="rounded-lg bg-muted/40 border border-dashed border-border p-4 text-center">
              <p className="text-xs text-muted-foreground">Nenhum serviço registrado ainda</p>
            </div>
          </div>
        )}
      </div>

      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSubmit={handleAddService}
      />
    </>
  );
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  done: { label: 'Concluído', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  in_progress: { label: 'Em Andamento', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  pending: { label: 'Pendente', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
};

function ServiceItem({ service, index, onDelete }: { service: Service; index: number; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const colorClass = SERVICE_TYPE_COLORS[service.serviceType] || SERVICE_TYPE_COLORS['Outro'];
  const statusCfg = STATUS_CONFIG[service.status || 'done'];
  const duration = calcDuration(service.startTime, service.endTime);

  return (
    <div className="px-5 py-3 hover:bg-muted/20 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <span className="text-xs font-bold text-muted-foreground mt-0.5 w-4 flex-shrink-0">{index}.</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-sm text-foreground">{service.clientName}</span>
              <span className="text-xs text-muted-foreground font-mono">#{service.clientCode}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', colorClass)}>
                {service.serviceType}
              </span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusCfg.className)}>
                {statusCfg.label}
              </span>
              {service.startTime && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {service.startTime}{service.endTime ? ` – ${service.endTime}` : ''}
                  {duration && <span className="text-emerald-600 dark:text-emerald-400 ml-0.5">({duration})</span>}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 ml-6 space-y-2 text-xs">
          {service.description && (
            <div>
              <p className="font-semibold text-muted-foreground mb-1">Descrição:</p>
              <p className="text-foreground">{service.description}</p>
            </div>
          )}
          {service.procedures.length > 0 && (
            <div>
              <p className="font-semibold text-muted-foreground mb-1">Procedimentos:</p>
              <ul className="space-y-0.5">
                {service.procedures.map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-foreground">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {service.analysis && (
            <div>
              <p className="font-semibold text-muted-foreground mb-1">Análise Técnica:</p>
              <p className="text-foreground">{service.analysis}</p>
            </div>
          )}
          {service.observations.some(o => o) && (
            <div>
              <p className="font-semibold text-muted-foreground mb-1">Observações:</p>
              <ul className="space-y-0.5">
                {service.observations.filter(o => o).map((o, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-foreground">
                    <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
