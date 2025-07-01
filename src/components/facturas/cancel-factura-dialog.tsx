"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CancelFacturaDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onConfirm: () => void;
  facturaNumero?: string;
}

export default function CancelFacturaDialog({
  isOpen,
  setIsOpen,
  onConfirm,
  facturaNumero,
}: CancelFacturaDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Está seguro que desea cancelar la factura?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto cambiará el estado de la
            factura "{facturaNumero || "seleccionada"}" a "Cancelada".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Volver</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Confirmar Cancelación
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
