export interface Service {
  id: string;
  clientCode: string;
  clientName: string;
  serviceType: string;
  description: string;
  procedures: string[];
  analysis?: string;
  observations: string[];
  startTime?: string;   // HH:MM
  endTime?: string;     // HH:MM
  status?: 'pending' | 'in_progress' | 'done'; // status do atendimento
  createdAt: string;
}

export interface Technician {
  id: string;
  technicianName: string;
  responsibleName: string;
  date: string;
  services: Service[];
  createdAt: string;
}

// Utilitário para calcular duração entre dois horários HH:MM
export function calcDuration(start?: string, end?: string): string | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const totalMin = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMin <= 0) return null;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${m}min`;
}
