import { useState, useEffect } from 'react';
import { Plus, FileText, Users, ClipboardList, TrendingUp } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import TechnicianModal from '@/components/TechnicianModal';
import TechnicianCard from '@/components/TechnicianCard';
import { Technician } from '@/lib/types';

const STORAGE_KEY = 'tcf_technicians_v2';

export default function Home() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTechnicians(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load technicians:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(technicians));
  }, [technicians]);

  const handleAddTechnician = (data: { technicianName: string; responsibleName: string; date: string }) => {
    const newTechnician: Technician = {
      id: Date.now().toString(),
      technicianName: data.technicianName,
      responsibleName: data.responsibleName,
      date: data.date,
      services: [],
      createdAt: new Date().toISOString(),
    };
    setTechnicians(prev => [...prev, newTechnician]);
    setIsModalOpen(false);
  };

  const handleDeleteTechnician = (id: string) => {
    setTechnicians(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTechnician = (id: string, technician: Technician) => {
    setTechnicians(prev => prev.map(t => (t.id === id ? technician : t)));
  };

  const totalServices = technicians.reduce((acc, t) => acc + t.services.length, 0);
  const totalDone = technicians.reduce((acc, t) => acc + t.services.filter(s => !s.status || s.status === 'done').length, 0);
  const totalPending = technicians.reduce((acc, t) => acc + t.services.filter(s => s.status === 'pending' || s.status === 'in_progress').length, 0);
  const totalMinutes = technicians.reduce((acc, t) => {
    return acc + t.services.reduce((a, s) => {
      if (!s.startTime || !s.endTime) return a;
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      return diff > 0 ? a + diff : a;
    }, 0);
  }, 0);
  const totalTimeStr = totalMinutes > 0
    ? (totalMinutes >= 60 ? `${Math.floor(totalMinutes/60)}h${totalMinutes%60 > 0 ? totalMinutes%60+'min' : ''}` : `${totalMinutes}min`)
    : null;
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-full">
        {/* Page Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Relatórios Diários</h1>
              <p className="text-sm text-muted-foreground capitalize">{today}</p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Técnico</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        {technicians.length > 0 && (
          <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3 bg-card rounded-lg px-4 py-3 border border-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Técnicos</p>
                <p className="text-lg font-bold text-foreground">{technicians.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-card rounded-lg px-4 py-3 border border-border">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <ClipboardList className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Serviços</p>
                <p className="text-lg font-bold text-foreground">{totalServices}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-card rounded-lg px-4 py-3 border border-border">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Concluídos</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{totalDone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-card rounded-lg px-4 py-3 border border-border">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{totalPending > 0 ? 'Pendentes' : 'Tempo Total'}</p>
                <p className={`text-lg font-bold ${totalPending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                  {totalPending > 0 ? totalPending : (totalTimeStr || '—')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 px-6 py-6">
          {technicians.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Nenhum técnico hoje</h2>
              <p className="text-muted-foreground mb-8 max-w-sm">
                Comece adicionando um técnico para registrar os serviços realizados no dia.
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                <Plus className="h-5 w-5" />
                Adicionar Primeiro Técnico
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {technicians.map(technician => (
                <TechnicianCard
                  key={technician.id}
                  technician={technician}
                  onDelete={handleDeleteTechnician}
                  onUpdate={handleUpdateTechnician}
                />
              ))}
              {/* Add new card button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group min-h-[200px]"
              >
                <div className="w-12 h-12 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                  <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                  Adicionar Técnico
                </p>
              </button>
            </div>
          )}
        </div>
      </div>

      <TechnicianModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTechnician}
      />
    </DashboardLayout>
  );
}
