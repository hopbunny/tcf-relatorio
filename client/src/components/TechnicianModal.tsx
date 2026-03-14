import { useState } from 'react';
import { User, UserCheck, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { technicianName: string; responsibleName: string; date: string }) => void;
}

export default function TechnicianModal({ isOpen, onClose, onSubmit }: TechnicianModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    technicianName: '',
    responsibleName: '',
    date: today,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.technicianName.trim()) errs.technicianName = 'Nome do técnico é obrigatório';
    if (!form.responsibleName.trim()) errs.responsibleName = 'Nome do responsável é obrigatório';
    if (!form.date) errs.date = 'Data é obrigatória';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
    setForm({ technicianName: '', responsibleName: '', date: today });
    setErrors({});
  };

  const handleClose = () => {
    setForm({ technicianName: '', responsibleName: '', date: today });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold">Novo Técnico</DialogTitle>
            <p className="text-white/70 text-sm mt-1">Preencha os dados para criar o relatório do dia</p>
          </DialogHeader>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="technicianName" className="text-sm font-semibold flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-primary" />
              Nome do Técnico
            </Label>
            <Input
              id="technicianName"
              placeholder="Ex: João da Silva"
              value={form.technicianName}
              onChange={e => setForm(prev => ({ ...prev, technicianName: e.target.value }))}
              className={errors.technicianName ? 'border-destructive focus-visible:ring-destructive' : ''}
              autoFocus
            />
            {errors.technicianName && (
              <p className="text-xs text-destructive">{errors.technicianName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsibleName" className="text-sm font-semibold flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5 text-primary" />
              Responsável pelo Relatório
            </Label>
            <Input
              id="responsibleName"
              placeholder="Ex: Maria Santos"
              value={form.responsibleName}
              onChange={e => setForm(prev => ({ ...prev, responsibleName: e.target.value }))}
              className={errors.responsibleName ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.responsibleName && (
              <p className="text-xs text-destructive">{errors.responsibleName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Data
            </Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
              className={errors.date ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
              Criar Técnico
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
