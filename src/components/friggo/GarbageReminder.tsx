import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useKaza } from "@/contexts/FriggoContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Trash2,
  Bell,
  Clock,
  MapPin,
  Calendar,
  Check,
  Building2,
  Home,
  Save
} from "lucide-react";
import { toast } from "sonner";
import { startGarbageReminderMonitoring } from "@/lib/garbageReminderNotifications";

interface GarbageReminderProps {
  open: boolean;
  onClose: () => void;
}

const WEEKDAYS = {
  "pt-BR": [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado"
  ],
  en: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ],
  es: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
};

export function GarbageReminder({ open, onClose }: GarbageReminderProps) {
  const { language } = useLanguage();
  const { onboardingData, homeId } = useKaza();
  const { user } = useAuth();

  const [enabled, setEnabled] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 4]); // Monday and Thursday
  const [reminderTime, setReminderTime] = useState("20:00");
  const [garbageLocation, setGarbageLocation] = useState<"street" | "building">(
    "street"
  );
  const [buildingFloor, setBuildingFloor] = useState("");

  useEffect(() => {
    if (!open) return;
    const loadFromDB = async () => {
      if (user && homeId) {
        const { data } = await supabase
          .from("garbage_reminders")
          .select("*")
          .eq("home_id", homeId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) {
          setEnabled((data as any).enabled ?? false);
          setSelectedDays((data as any).selected_days ?? [1, 4]);
          setReminderTime((data as any).reminder_time ?? "20:00");
          setGarbageLocation((data as any).garbage_location ?? "street");
          setBuildingFloor((data as any).building_floor ?? "");
          return;
        }
      }
      // Fallback: lê do cache local (chave nova, depois chave antiga para migração)
      const cached = localStorage.getItem("kaza-garbage-reminder") || localStorage.getItem("friggo-garbage-reminder");
      if (cached) {
        try {
          const data = JSON.parse(cached);
          setEnabled(data.enabled ?? false);
          setSelectedDays(data.selected_days ?? data.selectedDays ?? [1, 4]);
          setReminderTime(data.reminder_time ?? data.reminderTime ?? "20:00");
          setGarbageLocation(data.garbage_location ?? data.garbageLocation ?? "street");
          setBuildingFloor(data.building_floor ?? data.buildingFloor ?? "");
          // migra chave antiga
          localStorage.removeItem("friggo-garbage-reminder");
        } catch { /* ignora */ }
      }
    };
    loadFromDB();
  }, [open, user, homeId]);

  const labels = {
    "pt-BR": {
      title: "Lembrete do Lixo",
      subtitle: "Nunca mais esqueça de colocar o lixo para fora",
      enableReminder: "Ativar Lembrete",
      enableDesc: "Receba um aviso na noite anterior",
      collectionDays: "Dias de Coleta",
      selectDays: "Selecione os dias que o lixeiro passa",
      reminderTime: "Horário do Lembrete",
      location: "Local do Lixo",
      street: "Rua (Colocar para fora)",
      building: "Prédio (Descer ao lixo)",
      floor: "Andar do Apartamento",
      floorPlaceholder: "Ex: 5º andar",
      save: "Salvar",
      nextReminder: "Próximo lembrete",
      tonight: "Hoje à noite!",
      tomorrow: "Amanhã à noite",
      in: "Em",
      days: "dias",
      reminderMsg: "Não esqueça de colocar o lixo para fora!",
      reminderMsgBuilding: "Não esqueça de descer o lixo!"
    },
    en: {
      title: "Garbage Reminder",
      subtitle: "Never forget to take out the trash",
      enableReminder: "Enable Reminder",
      enableDesc: "Get notified the night before",
      collectionDays: "Collection Days",
      selectDays: "Select the days garbage is collected",
      reminderTime: "Reminder Time",
      location: "Garbage Location",
      street: "Street (Take outside)",
      building: "Building (Take to garbage room)",
      floor: "Apartment Floor",
      floorPlaceholder: "Ex: 5th floor",
      save: "Save",
      nextReminder: "Next reminder",
      tonight: "Tonight!",
      tomorrow: "Tomorrow night",
      in: "In",
      days: "days",
      reminderMsg: "Don't forget to take out the trash!",
      reminderMsgBuilding: "Don't forget to take the trash down!"
    },
    es: {
      title: "Recordatorio de Basura",
      subtitle: "Nunca más olvides sacar la basura",
      enableReminder: "Activar Recordatorio",
      enableDesc: "Recibe un aviso la noche anterior",
      collectionDays: "Días de Recolección",
      selectDays: "Selecciona los días de recolección",
      reminderTime: "Hora del Recordatorio",
      location: "Ubicación de la Basura",
      street: "Calle (Sacar afuera)",
      building: "Edificio (Bajar a la basura)",
      floor: "Piso del Apartamento",
      floorPlaceholder: "Ej: 5º piso",
      save: "Guardar",
      nextReminder: "Próximo recordatorio",
      tonight: "¡Esta noche!",
      tomorrow: "Mañana por la noche",
      in: "En",
      days: "días",
      reminderMsg: "¡No olvides sacar la basura!",
      reminderMsgBuilding: "¡No olvides bajar la basura!"
    }
  };

  const l = labels[language];
  const weekdays = WEEKDAYS[language];
  const isApartment = onboardingData?.homeType === "apartment";

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const getNextReminderInfo = () => {
    if (selectedDays.length === 0) return null;

    const today = new Date();
    const currentDay = today.getDay();
    const currentHour = today.getHours();
    const reminderHour = parseInt(reminderTime.split(":")[0]);

    // Find the next collection day
    let daysUntilCollection = Infinity;

    for (const day of selectedDays) {
      // Collection is on this day, so reminder is night before
      const reminderDay = day === 0 ? 6 : day - 1;
      let diff = reminderDay - currentDay;

      if (diff < 0) diff += 7;
      if (diff === 0 && currentHour >= reminderHour) diff = 7;

      if (diff < daysUntilCollection) {
        daysUntilCollection = diff;
      }
    }

    if (daysUntilCollection === 0) return l.tonight;
    if (daysUntilCollection === 1) return l.tomorrow;
    return `${l.in} ${daysUntilCollection} ${l.days}`;
  };

  const handleSave = async () => {
    // DB é a fonte de verdade — grava primeiro
    if (user && homeId) {
      const { error } = await supabase
        .from("garbage_reminders")
        .upsert({
          home_id: homeId,
          user_id: user.id,
          enabled,
          selected_days: selectedDays,
          reminder_time: reminderTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo",
          garbage_location: garbageLocation,
          building_floor: buildingFloor || null,
        }, { onConflict: "home_id,user_id" });

      if (error && import.meta.env.DEV) {
        console.error("[DEV] garbage_reminders upsert error:", error);
      }
    }

    // Atualiza cache local para o scheduler de notificações
    localStorage.setItem("kaza-garbage-reminder", JSON.stringify({
      enabled, selectedDays, reminderTime, garbageLocation, buildingFloor,
    }));

    // Start monitoring if enabled
    if (enabled && selectedDays.length > 0) {
      startGarbageReminderMonitoring();
    }

    const successMsg = {
      "pt-BR": "Lembrete configurado! Você receberá notificações nas datas selecionadas.",
      en: "Reminder configured! You'll get notifications on the selected days.",
      es: "¡Recordatorio configurado! Recibirás notificaciones en los días seleccionados."
    };
    toast.success(successMsg[language]);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0 bg-[#fafafa] dark:bg-[#091f1c]">
        <SheetHeader className="border-b border-primary/10 px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Trash2 className="h-5 w-5 text-primary" />
            {l.title}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(90vh-80px)]">
          <div className="space-y-4 px-4 py-5 pb-10">
            {/* Enable/Disable */}
            <Card className="border-primary/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Label className="font-semibold text-foreground">{l.enableReminder}</Label>
                    <p className="text-xs text-muted-foreground">{l.enableDesc}</p>
                  </div>
                </div>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </CardContent>
            </Card>

            {enabled && (
              <>
                {/* Collection Days */}
                <Card className="border-primary/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-foreground">
                      <Calendar className="h-4 w-4 text-primary" />
                      {l.collectionDays}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-3 text-xs text-muted-foreground font-medium">{l.selectDays}</p>
                    <div className="flex flex-wrap gap-2">
                      {weekdays.map((day, index) => (
                        <button
                          key={index}
                          onClick={() => toggleDay(index)}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all active:scale-95 ${
                            selectedDays.includes(index)
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {selectedDays.includes(index) && (
                            <Check className="h-3 w-3" />
                          )}
                          {day.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Reminder Time */}
                <Card className="border-primary/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-foreground">
                      <Clock className="h-4 w-4 text-primary" />
                      {l.reminderTime}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full h-12 bg-muted/50 border border-primary/10 rounded-lg text-base font-semibold px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </CardContent>
                </Card>

                {/* Location */}
                <Card className="border-primary/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      {l.location}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => setGarbageLocation("street")}
                        className={`flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all active:scale-95 ${
                          garbageLocation === "street"
                            ? "border-primary bg-primary/10 shadow-md shadow-primary/25"
                            : "border-primary/10 bg-muted/30 hover:border-primary/30"
                        }`}
                      >
                        <Home className={`h-6 w-6 ${garbageLocation === "street" ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-xs font-semibold text-center text-foreground">
                          {l.street}
                        </span>
                      </button>
                      <button
                        onClick={() => setGarbageLocation("building")}
                        className={`flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all active:scale-95 ${
                          garbageLocation === "building"
                            ? "border-primary bg-primary/10 shadow-md shadow-primary/25"
                            : "border-primary/10 bg-muted/30 hover:border-primary/30"
                        }`}
                      >
                        <Building2 className={`h-6 w-6 ${garbageLocation === "building" ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-xs font-semibold text-center text-foreground">
                          {l.building}
                        </span>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Next Reminder */}
                {selectedDays.length > 0 && (
                  <Card className="bg-primary/10 border-primary/30 shadow-md shadow-primary/15">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-primary/20 p-2.5">
                            <Bell className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-primary">
                              {l.nextReminder}
                            </p>
                            <p className="text-xs text-primary/70 font-medium">
                              {garbageLocation === "street"
                                ? l.reminderMsg
                                : l.reminderMsgBuilding}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-white dark:bg-card text-primary font-bold shadow-sm"
                        >
                          {getNextReminderInfo()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            <Button
              onClick={handleSave}
              disabled={enabled && selectedDays.length === 0}
              className="w-full rounded-xl py-6 font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/25"
            >
              <Save className="h-4 w-4" />
              {l.save}
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
