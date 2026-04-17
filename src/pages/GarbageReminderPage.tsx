import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useKaza } from "@/contexts/FriggoContext";
import { AlarmClock, ArrowLeft, Bell, Building2, Calendar, Check, Clock, Home, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/components/PageTransition";
import {
  startGarbageReminderMonitoring,
  syncGarbageReminderToDb
} from "@/lib/garbageReminderNotifications";

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

export default function GarbageReminderPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { onboardingData, homeId } = useKaza();

  const [enabled, setEnabled] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 4]); // Monday and Thursday
  const [reminderTime, setReminderTime] = useState("20:00");
  const [garbageLocation, setGarbageLocation] = useState<"street" | "building">(
    "street"
  );
  const [buildingFloor, setBuildingFloor] = useState("");

  const STORAGE_KEY = "kaza-garbage-reminder";

  // Load from localStorage (with migration from old friggo key)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("friggo-garbage-reminder");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setEnabled(data.enabled ?? false);
        setSelectedDays(data.selectedDays ?? [1, 4]);
        setReminderTime(data.reminderTime ?? "20:00");
        setGarbageLocation(data.garbageLocation ?? "street");
        setBuildingFloor(data.buildingFloor ?? "");
        // Migrate old key
        localStorage.removeItem("friggo-garbage-reminder");
      } catch (e) {
        console.error("Error parsing garbage reminder settings:", e);
      }
    }
  }, []);

  const labels = {
    "pt-BR": {
      title: "Lembrete do Lixo",
      subtitle: "Nunca mais esqueça de colocar o lixo para fora",
      enableReminder: "Ativar Lembrete",
      enableDesc: "Receba um aviso no horário programado",
      collectionDays: "Dias de Coleta",
      selectDays: "Selecione os dias que o lixeiro passa",
      reminderTime: "Horário do Lembrete",
      location: "Local do Lixo",
      street: "Rua (Colocar para fora)",
      building: "Prédio (Descer ao lixo)",
      floor: "Andar do Apartamento",
      floorPlaceholder: "Ex: 5º andar",
      save: "Salvar Configuração",
      saved: "Configuração salva!",
      nextReminder: "Próximo lembrete",
      tonight: "Hoje!",
      tomorrow: "Amanha",
      in: "Em",
      days: "dias",
      reminderMsg: "Não esqueça de colocar o lixo para fora!",
      reminderMsgBuilding: "Não esqueça de descer o lixo!"
    },
    en: {
      title: "Garbage Reminder",
      subtitle: "Never forget to take out the trash",
      enableReminder: "Enable Reminder",
      enableDesc: "Get notified at the scheduled time",
      collectionDays: "Collection Days",
      selectDays: "Select the days garbage is collected",
      reminderTime: "Reminder Time",
      location: "Garbage Location",
      street: "Street (Take outside)",
      building: "Building (Take to garbage room)",
      floor: "Apartment Floor",
      floorPlaceholder: "Ex: 5th floor",
      save: "Save Settings",
      saved: "Settings saved!",
      nextReminder: "Next reminder",
      tonight: "Today!",
      tomorrow: "Tomorrow",
      in: "In",
      days: "days",
      reminderMsg: "Don't forget to take out the trash!",
      reminderMsgBuilding: "Don't forget to take the trash down!"
    },
    es: {
      title: "Recordatorio de Basura",
      subtitle: "Nunca más olvides sacar la basura",
      enableReminder: "Activar Recordatorio",
      enableDesc: "Recibe un aviso a la hora programada",
      collectionDays: "Días de Recolección",
      selectDays: "Selecciona los días de recolección",
      reminderTime: "Hora del Recordatorio",
      location: "Ubicación de la Basura",
      street: "Calle (Sacar afuera)",
      building: "Edificio (Bajar a la basura)",
      floor: "Piso del Apartamento",
      floorPlaceholder: "Ej: 5º piso",
      save: "Guardar Configuración",
      saved: "¡Configuración guardada!",
      nextReminder: "Próximo recordatorio",
      tonight: "¡Hoy!",
      tomorrow: "Mañana",
      in: "En",
      days: "días",
      reminderMsg: "¡No olvides sacar la basura!",
      reminderMsgBuilding: "¡No olvides bajar la basura!"
    }
  };

  const l = labels[language === "pt-BR" ? "pt-BR" : language === "es" ? "es" : "en"];
  const weekdays = WEEKDAYS[language === "pt-BR" ? "pt-BR" : language === "es" ? "es" : "en"];

  const handleSave = () => {
    const data = { enabled, selectedDays, reminderTime, garbageLocation, buildingFloor };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (enabled && selectedDays.length > 0) {
      startGarbageReminderMonitoring();
    }
    // Espelhar no banco (best-effort, não bloqueia UX)
    void syncGarbageReminderToDb(homeId);
    toast.success(l.saved, { duration: 2000 });
    navigate(-1);
  };

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
    const currentMinute = today.getMinutes();
    const [reminderH, reminderM] = reminderTime.split(":").map(Number);

    let daysUntilReminder = Infinity;

    for (const collectionDay of selectedDays) {
      let diff = collectionDay - currentDay;
      if (diff < 0) diff += 7;
      
      // If collectionDay is today, check if reminder time has passed
      if (diff === 0 && (currentHour > reminderH || (currentHour === reminderH && currentMinute >= reminderM))) {
        diff = 7;
      }

      if (diff < daysUntilReminder) {
        daysUntilReminder = diff;
      }
    }

    if (daysUntilReminder === 0) return l.tonight;
    if (daysUntilReminder === 1) return l.tomorrow;
    return `${l.in} ${daysUntilReminder} ${l.days}`;
  };

  return (
    <PageTransition
      direction="left"
      className="min-h-[100dvh] bg-[#fafafa] dark:bg-[#091f1c] pb-20"
    >
      <header className="sticky top-0 z-50 flex items-center gap-3 bg-[#fafafa]/80 dark:bg-[#091f1c]/80 px-4 py-4 backdrop-blur-2xl font-bold">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-foreground bg-white/80 dark:bg-white/10 backdrop-blur-xl active:scale-[0.97] transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-primary" /> {l.title}
        </h1>
      </header>

      <main className="mx-auto max-w-lg px-6 py-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">{l.title}</h2>
          <p className="text-sm text-muted-foreground font-medium">{l.subtitle}</p>
        </div>

        <Card className="border-none bg-muted/30 shadow-none">
          <CardContent className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-primary/10 p-3">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <Label className="text-base font-bold">
                  {l.enableReminder}
                </Label>
                <p className="text-xs text-muted-foreground font-medium">
                  {l.enableDesc}
                </p>
              </div>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              className="data-[state=checked]:bg-primary"
            />
          </CardContent>
        </Card>

        {enabled && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-bold opacity-60 px-1 uppercase tracking-wider">
                <Calendar className="h-4 w-4" /> {l.collectionDays}
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {weekdays.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => toggleDay(index)}
                    className={`flex items-center justify-center rounded-xl py-3 text-sm font-bold transition-all active:scale-95 ${
                      selectedDays.includes(index)
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {day.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-bold opacity-60 px-1 uppercase tracking-wider">
                <Clock className="h-4 w-4" /> {l.reminderTime}
              </Label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full h-14 bg-muted/30 border-none rounded-xl text-base font-bold px-5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-bold opacity-60 px-1 uppercase tracking-wider">
                <MapPin className="h-4 w-4" /> {l.location}
              </Label>
              <div className="flex gap-4">
                <button
                  onClick={() => setGarbageLocation("street")}
                  className={`flex flex-1 flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all active:scale-95 ${
                    garbageLocation === "street"
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-white/5 bg-muted/30 opacity-60 grayscale"
                  }`}
                >
                  <Home className="h-8 w-8 text-primary" />
                  <span className="text-xs font-bold text-center tracking-tight leading-tight">
                    {l.street}
                  </span>
                </button>
                <button
                  onClick={() => setGarbageLocation("building")}
                  className={`flex flex-1 flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all active:scale-95 ${
                    garbageLocation === "building"
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-white/5 bg-muted/30 opacity-60 grayscale"
                  }`}
                >
                  <Building2 className="h-8 w-8 text-primary" />
                  <span className="text-xs font-bold text-center tracking-tight leading-tight">
                    {l.building}
                  </span>
                </button>
              </div>
            </div>

            {selectedDays.length > 0 && (
              <div className="bg-primary/10 rounded-2xl p-6 flex items-center justify-between border border-primary/20">
                <div className="space-y-1 text-left">
                  <p className="text-sm font-bold text-primary">
                    {l.nextReminder}
                  </p>
                  <p className="text-xs text-primary/60 font-medium leading-tight max-w-[150px]">
                    {garbageLocation === "street"
                      ? l.reminderMsg
                      : l.reminderMsgBuilding}
                  </p>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {getNextReminderInfo()}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── Floating Save Button ── */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#fafafa] dark:from-[#091f1c] to-transparent z-40 pointer-events-none pb-safe">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center h-14 rounded-2xl text-white text-[15px] font-bold shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
            style={{ background: "#165A52" }}
          >
            <Check className="h-5 w-5 mr-2" />
            {l.save}
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
