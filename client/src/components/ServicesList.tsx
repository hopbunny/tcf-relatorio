import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Service } from '@/lib/types';

interface ServicesListProps {
  services: Service[];
  onDeleteService: (id: string) => void;
}

export default function ServicesList({ services, onDeleteService }: ServicesListProps) {
  return (
    <div className="space-y-3">
      {services.map((service) => (
        <div key={service.id} className="bg-muted/50 rounded-lg p-3 text-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {service.clientCode} - {service.clientName}
              </p>
              <p className="text-xs text-muted-foreground">{service.serviceType}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDeleteService(service.id)}
              className="h-6 w-6"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          {service.description && (
            <p className="text-xs text-muted-foreground mb-2">{service.description}</p>
          )}
          {service.procedures.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-foreground mb-1">Procedimentos:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {service.procedures.map((proc, idx) => (
                  <li key={idx} className="ml-4">• {proc}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
