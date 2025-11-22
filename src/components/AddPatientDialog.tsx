import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

interface AddPatientDialogProps {
  therapistId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatientAdded: () => void;
}

export default function AddPatientDialog({
  therapistId,
  open,
  onOpenChange,
  onPatientAdded,
}: AddPatientDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Find user by email through their profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", email)
        .single();

      if (profileError || !profile) {
        // Try to find by user email in auth.users (we need to use a different approach)
        // Since we can't query auth.users directly, we'll use the email as ID for now
        toast.error("Paciente no encontrado. Verifica el email.");
        setLoading(false);
        return;
      }

      // Check if patient is already linked
      const { data: existing } = await supabase
        .from("therapist_patients")
        .select("id")
        .eq("therapist_id", therapistId)
        .eq("patient_id", profile.id)
        .single();

      if (existing) {
        toast.error("Este paciente ya está asignado a tu lista");
        setLoading(false);
        return;
      }

      // Check if user is a patient (not a therapist)
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profile.id)
        .eq("role", "therapist");

      if (roles && roles.length > 0) {
        toast.error("No puedes agregar a otro terapeuta como paciente");
        setLoading(false);
        return;
      }

      // Add patient to therapist's list
      const { error: linkError } = await supabase
        .from("therapist_patients")
        .insert({
          therapist_id: therapistId,
          patient_id: profile.id,
        });

      if (linkError) throw linkError;

      toast.success("¡Paciente agregado exitosamente!");
      setEmail("");
      onOpenChange(false);
      onPatientAdded();
    } catch (error: any) {
      console.error("Error adding patient:", error);
      toast.error("Error al agregar paciente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Agregar Paciente
          </DialogTitle>
          <DialogDescription>
            Ingresa el ID del paciente para agregarlo a tu lista
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddPatient} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient-id">ID del Paciente</Label>
            <Input
              id="patient-id"
              type="text"
              placeholder="Ej: 123e4567-e89b-12d3-a456-426614174000"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              El paciente puede encontrar su ID en su perfil
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Agregando..." : "Agregar Paciente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
