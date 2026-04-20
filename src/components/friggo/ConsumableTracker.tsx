/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useKaza } from "@/contexts/FriggoContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ShoppingCart,
  TrendingDown,
  Calendar,
  Package,
  Bell,
  Plus,
  Minus,
  Settings2,
  ChevronLeft,
  ArrowLeft,
  PlusCircle,
  BoxIcon,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { cn, sanitizeFloatInput, parseSafeFloat } from "@/lib/utils";

interface ConsumableTrackerProps {
  open?: boolean;
  onClose?: () => void;
  inline?: boolean;
}

interface ConsumableItem {
  id: string;
  name: string;
  icon: string;
  currentStock: number;
  unit: string;
  dailyConsumption: number;
  minStock: number;
}

const ICON_OPTIONS = [
  "🧻",
  "🧺",
  "🧴",
  "🧼",
  "🪥",
  "🧽",
  "🫧",
  "🪣",
  "🧹",
  "🪒",
  "💊",
  "🩹",
  "🩺",
  "🧪",
  "🪤",
  "📦",
  "🧃",
  "🥤",
  "🧊",
  "🕯️",
  "💡",
  "🔋",
  "🗑️",
  "🛁"
];

const defaultConsumables: ConsumableItem[] = [
  {
    id: "1",
    name: "Papel Higiênico",
    icon: "🧻",
    currentStock: 12,
    unit: "rolos",
    dailyConsumption: 1,
    minStock: 4
  },
  {
    id: "2",
    name: "Papel Toalha",
    icon: "🧺",
    currentStock: 4,
    unit: "rolos",
    dailyConsumption: 0.5,
    minStock: 2
  },
  {
    id: "3",
    name: "Detergente",
    icon: "🧴",
    currentStock: 2,
    unit: "unidades",
    dailyConsumption: 0.1,
    minStock: 1
  },
  {
    id: "4",
    name: "Sabonete",
    icon: "🧼",
    currentStock: 3,
    unit: "unidades",
    dailyConsumption: 0.15,
    minStock: 2
  },
  {
    id: "5",
    name: "Pasta de Dente",
    icon: "🪥",
    currentStock: 2,
    unit: "tubos",
    dailyConsumption: 0.05,
    minStock: 1
  }
];

const labels = {
  "pt-BR": {
    title: "Rastreamento de Consumíveis",
    howItWorks: "Como funciona",
    howItWorksDesc:
      "Defina seu consumo diário e o app calcula quando você precisará comprar mais.",
    debit: "Debitar",
    restock: "Repor",
    customAmount: "Quantidade",
    confirm: "Confirmar",
    addItem: "Adicionar consumível",
    newItem: "Novo consumível",
    itemName: "Nome do item",
    currentStock: "Estoque atual",
    dailyUse: "Consumo/dia",
    unit: "Unidade",
    minStock: "Estoque mín.",
    perDay: "/dia",
    daysLeft: "d",
    addedToList: "adicionado à lista de compras!",
    consumptionLogged: "Consumo registrado!",
    restocked: "Estoque reposto!",
    itemAdded: "Item adicionado!",
    editSettings: "Configurações",
    save: "Salvar",
    cancel: "Cancelar",
    chooseIcon: "Escolha um ícone",
    back: "Voltar",
    presets: "Carregar básicos",
    presetsDesc: "Escolha um kit de consumíveis para começar",
    loadPreset: "Carregar",
    clearAll: "Limpar tudo",
    clearConfirm: "Isso removerá todos os consumíveis. Continuar?",
    bathroom: "🛁 Banheiro",
    kitchen: "🍳 Cozinha",
    cleaning: "🧹 Limpeza",
    personal: "💆 Higiene Pessoal",
    complete: "📦 Kit Completo",
    loaded: "Preset carregado!",
    cleared: "Consumíveis limpos!",
    configFromZero: "Configurar do zero"
  },
  en: {
    title: "Consumable Tracking",
    howItWorks: "How it works",
    howItWorksDesc:
      "Set your daily consumption and the app calculates when you need to buy more.",
    debit: "Debit",
    restock: "Restock",
    customAmount: "Amount",
    confirm: "Confirm",
    addItem: "Add consumable",
    newItem: "New consumable",
    itemName: "Item name",
    currentStock: "Current stock",
    dailyUse: "Daily use",
    unit: "Unit",
    minStock: "Min stock",
    perDay: "/day",
    daysLeft: "d",
    addedToList: "added to shopping list!",
    consumptionLogged: "Consumption logged!",
    restocked: "Stock restocked!",
    itemAdded: "Item added!",
    editSettings: "Settings",
    save: "Save",
    cancel: "Cancel",
    chooseIcon: "Choose an icon",
    back: "Back",
    presets: "Load basics",
    presetsDesc: "Choose a consumable kit to get started",
    loadPreset: "Load",
    clearAll: "Clear all",
    clearConfirm: "This will remove all consumables. Continue?",
    bathroom: "🛁 Bathroom",
    kitchen: "🍳 Kitchen",
    cleaning: "🧹 Cleaning",
    personal: "💆 Personal Care",
    complete: "📦 Complete Kit",
    loaded: "Preset loaded!",
    cleared: "Consumables cleared!",
    configFromZero: "Configure from zero"
  },
  es: {
    title: "Rastreo de Consumibles",
    howItWorks: "Cómo funciona",
    howItWorksDesc:
      "Define tu consumo diario y la app calcula cuándo necesitarás comprar más.",
    debit: "Debitar",
    restock: "Reponer",
    customAmount: "Cantidad",
    confirm: "Confirmar",
    addItem: "Agregar consumible",
    newItem: "Nuevo consumible",
    itemName: "Nombre del item",
    currentStock: "Stock actual",
    dailyUse: "Consumo/día",
    unit: "Unidad",
    minStock: "Stock mín.",
    perDay: "/día",
    daysLeft: "d",
    addedToList: "agregado a la lista de compras!",
    consumptionLogged: "¡Consumo registrado!",
    restocked: "¡Stock repuesto!",
    itemAdded: "¡Item agregado!",
    editSettings: "Configuración",
    save: "Guardar",
    cancel: "Cancelar",
    chooseIcon: "Elige un ícono",
    back: "Volver",
    presets: "Cargar básicos",
    presetsDesc: "Elige un kit de consumibles para empezar",
    loadPreset: "Cargar",
    clearAll: "Limpiar todo",
    clearConfirm: "Esto eliminará todos los consumibles. ¿Continuar?",
    bathroom: "🛁 Baño",
    kitchen: "🍳 Cocina",
    cleaning: "🧹 Limpieza",
    personal: "💆 Cuidado Personal",
    complete: "📦 Kit Completo",
    loaded: "¡Preset cargado!",
    cleared: "¡Consumibles limpiados!",
    configFromZero: "Configurar desde cero"
  }
};

type ScreenView = "list" | "add" | "edit" | "custom" | "presets";

export function ConsumableTracker({ open, onClose, inline }: ConsumableTrackerProps) {
  const {
    consumables,
    addConsumable,
    updateConsumable,
    removeConsumable,
    addToShoppingList,
    clearConsumables,
    setConsumablesBulk
  } = useKaza();
  const { language } = useLanguage();
  const l = labels[language];

  const [screen, setScreen] = useState<ScreenView>("list");
  const [newItem, setNewItem] = useState({
    name: "",
    icon: "📦",
    dailyConsumption: "1",
    unit: "unidades",
    currentStock: "10",
    minStock: "2",
    category: "hygiene" as any
  });

  const [customAction, setCustomAction] = useState<{
    id: string;
    type: "debit" | "restock";
  } | null>(null);
  const [customAmount, setCustomAmount] = useState("1");

  const [editItem, setEditItem] = useState<ConsumableItem | null>(null);
  const [editIcon, setEditIcon] = useState("");
  const [editDailyConsumption, setEditDailyConsumption] = useState("");
  const [editMinStock, setEditMinStock] = useState("");
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<
    "cleaning" | "hygiene" | "pantry"
  >("hygiene");

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const calculateDaysUntilEmpty = (item: ConsumableItem) => {
    if (item.dailyConsumption <= 0) return Infinity;
    return Math.floor(item.currentStock / item.dailyConsumption);
  };

  const getAlertLevel = (daysLeft: number): "ok" | "warning" | "danger" => {
    if (daysLeft <= 3) return "danger";
    if (daysLeft <= 7) return "warning";
    return "ok";
  };

  const handleDebit = (id: string, amount?: number) => {
    const item = consumables.find((c) => c.id === id);
    if (!item) return;
    const debitAmount = amount ?? item.dailyConsumption;
    updateConsumable(id, {
      currentStock: Math.max(0, item.currentStock - debitAmount)
    });
    toast.success(l.consumptionLogged);
  };

  const handleAddStock = (id: string, amount: number) => {
    const item = consumables.find((c) => c.id === id);
    if (!item) return;
    updateConsumable(id, { currentStock: item.currentStock + amount });
    toast.success(l.restocked);
  };

  const handleCustomConfirm = () => {
    if (!customAction) return;
    const amt = parseSafeFloat(customAmount, 0);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error(language === "pt-BR" ? "Quantidade inválida" : "Invalid amount");
      return;
    }
    if (customAction.type === "debit") handleDebit(customAction.id, amt);
    else handleAddStock(customAction.id, amt);
    setCustomAction(null);
    setCustomAmount("1");
    setScreen("list");
  };

  const handleSaveEdit = () => {
    if (!editItem) return;
    const daily = parseSafeFloat(editDailyConsumption, editItem.dailyConsumption);
    const min = parseSafeFloat(editMinStock, editItem.minStock);
    if (!Number.isFinite(daily) || !Number.isFinite(min)) {
      toast.error(language === "pt-BR" ? "Valores inválidos" : "Invalid values");
      return;
    }
    updateConsumable(editItem.id, {
      name: editName || editItem.name,
      icon: editIcon || editItem.icon,
      dailyConsumption: daily,
      minStock: min,
      category: editCategory
    });
    setEditItem(null);
    setScreen("list");
    toast.success(l.save);
  };

  const openEdit = (item: ConsumableItem) => {
    setEditItem(item);
    setEditName(item.name);
    setEditIcon(item.icon);
    setEditDailyConsumption(String(item.dailyConsumption));
    setEditMinStock(String(item.minStock));
    setEditCategory(item.category);
    setScreen("edit");
  };

  const handleAddToShopping = (item: ConsumableItem) => {
    addToShoppingList({
      name: item.name,
      quantity: item.minStock * 2,
      unit: item.unit,
      category: item.category,
      store: item.category === "hygiene" ? "pharmacy" : "market"
    });
    toast.success(`${item.name} ${l.addedToList}`);
  };

  const handleAddNewItem = () => {
    const current = parseSafeFloat(newItem.currentStock, 10);
    const daily = parseSafeFloat(newItem.dailyConsumption, 1);
    const min = parseSafeFloat(newItem.minStock, 2);
    if (!newItem.name || !Number.isFinite(current) || !Number.isFinite(daily) || !Number.isFinite(min)) {
      toast.error(language === "pt-BR" ? "Preencha todos os valores corretamente" : "Please fill values correctly");
      return;
    }
    addConsumable({
      name: newItem.name,
      icon: newItem.icon,
      currentStock: current,
      unit: newItem.unit,
      dailyConsumption: daily,
      minStock: min,
      category: newItem.category,
      usageInterval: "daily"
    });
    setNewItem({
      name: "",
      icon: "📦",
      dailyConsumption: "1",
      unit: "unidades",
      currentStock: "10",
      minStock: "2",
      category: "hygiene"
    });
    setScreen("list");
    toast.success(l.itemAdded);
  };

  const handleClose = () => {
    setScreen("list");
    onClose();
  };

  // --- Sub-screens rendered as full navigation views ---

  const renderAddScreen = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setScreen("list")}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-muted transition-all active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h2 className="text-lg font-bold text-foreground">{l.newItem}</h2>
      </div>

      <div>
        <Label className="text-xs font-semibold text-gray-500">
          {l.chooseIcon}
        </Label>
        <div className="mt-2 grid grid-cols-8 gap-2">
          {ICON_OPTIONS.map((icon) => (
            <button
              key={icon}
              onClick={() => setNewItem((p) => ({ ...p, icon }))}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-md text-xl transition-all active:scale-90",
                newItem.icon === icon
                  ? "bg-primary/20 ring-2 ring-primary shadow-sm"
                  : "bg-muted hover:bg-secondary"
              )}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold text-gray-500">
          {l.itemName}
        </Label>
        <Input
          placeholder="Ex: Amaciante"
          value={newItem.name}
          onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
          className="h-11 rounded-md mt-1.5"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-gray-500">
            {l.currentStock}
          </Label>
          <Input
            type="number"
            value={newItem.currentStock}
            onChange={(e) =>
              setNewItem((p) => ({ ...p, currentStock: sanitizeFloatInput(e.target.value) }))
            }
            className="h-11 rounded-md mt-1.5"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-500">
            {l.dailyUse}
          </Label>
          <Input
            type="number"
            step="0.1"
            value={newItem.dailyConsumption}
            onChange={(e) =>
              setNewItem((p) => ({ ...p, dailyConsumption: sanitizeFloatInput(e.target.value) }))
            }
            className="h-11 rounded-md mt-1.5"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-gray-500">
            {l.minStock}
          </Label>
          <Input
            type="number"
            value={newItem.minStock}
            onChange={(e) =>
              setNewItem((p) => ({ ...p, minStock: sanitizeFloatInput(e.target.value) }))
            }
            className="h-11 rounded-md mt-1.5"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-500">
            {l.unit}
          </Label>
          <Select
            value={newItem.unit}
            onValueChange={(v) => setNewItem((p) => ({ ...p, unit: v }))}
          >
            <SelectTrigger className="h-11 rounded-md mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unidades">
                {language === "en" ? "units" : "unidades"}
              </SelectItem>
              <SelectItem value="rolos">
                {language === "en" ? "rolls" : "rolos"}
              </SelectItem>
              <SelectItem value="ml">ml</SelectItem>
              <SelectItem value="L">L</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          className="flex-1 h-12 rounded-md"
          onClick={() => setScreen("list")}
        >
          {l.cancel}
        </Button>
        <Button
          className="flex-1 h-12 rounded-md"
          onClick={handleAddNewItem}
          disabled={!newItem.name}
        >
          {l.confirm}
        </Button>
      </div>
    </div>
  );

  const renderEditScreen = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setScreen("list")}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted transition-all active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-foreground truncate">
            {l.editSettings}
          </h2>
          <p className="text-xs text-muted-foreground truncate">{editItem?.name}</p>
        </div>
        <button
          onClick={() => {
            if (editItem) {
              removeConsumable(editItem.id);
              toast.success(language === "pt-BR" ? "Removido" : "Removed");
              setScreen("list");
            }
          }}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all active:scale-95"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      {/* Icon picker — compact scrollable row */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {l.chooseIcon}
        </Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {ICON_OPTIONS.map((icon) => (
            <button
              key={icon}
              onClick={() => setEditIcon(icon)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-all active:scale-90",
                editIcon === icon
                  ? "bg-emerald-50 dark:bg-emerald-500/20 ring-2 ring-emerald-500 shadow-sm"
                  : "bg-muted hover:bg-secondary"
              )}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {l.itemName}
        </Label>
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="h-11 rounded-xl mt-1.5 bg-white dark:bg-white/5 border-black/[0.06] dark:border-white/10"
        />
      </div>

      {/* Daily use + Min stock side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {l.dailyUse}
          </Label>
          <Input
            type="number"
            step="0.1"
            value={editDailyConsumption}
            onChange={(e) => setEditDailyConsumption(sanitizeFloatInput(e.target.value))}
            className="h-11 rounded-xl mt-1.5 bg-white dark:bg-white/5 border-black/[0.06] dark:border-white/10"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {l.minStock}
          </Label>
          <Input
            type="number"
            step="0.5"
            value={editMinStock}
            onChange={(e) => setEditMinStock(sanitizeFloatInput(e.target.value))}
            className="h-11 rounded-xl mt-1.5 bg-white dark:bg-white/5 border-black/[0.06] dark:border-white/10"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {language === "pt-BR" ? "Categoria" : language === "es" ? "Categoría" : "Category"}
        </Label>
        <Select
          value={editCategory}
          onValueChange={(v) => setEditCategory(v as any)}
        >
          <SelectTrigger className="h-11 rounded-xl mt-1.5 bg-white dark:bg-white/5 border-black/[0.06] dark:border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hygiene">
              🧴 {language === "pt-BR" ? "Higiene" : language === "es" ? "Higiene" : "Hygiene"}
            </SelectItem>
            <SelectItem value="cleaning">
              🧹 {language === "pt-BR" ? "Limpeza" : language === "es" ? "Limpieza" : "Cleaning"}
            </SelectItem>
            <SelectItem value="kitchen">
              🍳 {language === "pt-BR" ? "Cozinha" : language === "es" ? "Cocina" : "Kitchen"}
            </SelectItem>
            <SelectItem value="health">
              💊 {language === "pt-BR" ? "Saúde" : language === "es" ? "Salud" : "Health"}
            </SelectItem>
            <SelectItem value="other">
              📦 {language === "pt-BR" ? "Outros" : language === "es" ? "Otros" : "Other"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button className="w-full h-12 rounded-xl font-bold text-[15px]" onClick={handleSaveEdit}>
        {l.save}
      </Button>
    </div>
  );

  const renderCustomScreen = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setCustomAction(null);
            setScreen("list");
          }}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-muted transition-all active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h2 className="text-lg font-bold text-foreground">{l.customAmount}</h2>
      </div>

      <div className="flex flex-col items-center gap-4 py-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              setCustomAmount(
                String(Math.max(0.5, parseSafeFloat(customAmount, 1) - 0.5))
              )
            }
            className="flex h-14 w-14 items-center justify-center rounded-md bg-muted text-foreground transition-all active:scale-90"
          >
            <Minus className="h-6 w-6" />
          </button>
          <Input
            type="number"
            step="0.5"
            min="0.1"
            value={customAmount}
            onChange={(e) => setCustomAmount(sanitizeFloatInput(e.target.value))}
            className="h-16 w-28 rounded-md text-center text-3xl font-bold border-2"
          />
          <button
            onClick={() =>
              setCustomAmount(String(parseSafeFloat(customAmount, 0) + 0.5))
            }
            className="flex h-14 w-14 items-center justify-center rounded-md bg-primary/10 text-primary transition-all active:scale-90"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

      <Button className="w-full h-12 rounded-md" onClick={handleCustomConfirm}>
        {l.confirm}
      </Button>
    </div>
  );

  const renderListScreen = () => (
    <div className="space-y-4">

      {consumables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center max-w-[280px] mx-auto animate-in fade-in zoom-in duration-500">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-emerald-500/10 blur-2xl rounded-full scale-150" />
            <div className="relative h-20 w-20 rounded-[2.5rem] bg-white dark:bg-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-black/[0.04] dark:border-white/10 flex items-center justify-center">
              <Package className="h-10 w-10 text-emerald-500/60" />
            </div>
          </div>
          <h3 className="text-lg font-black text-foreground mb-2 tracking-tight">
            {l.configFromZero}
          </h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-8">
            {l.presetsDesc}
          </p>
          <Button 
            onClick={() => setScreen("presets")} 
            className="h-12 w-full rounded-2xl gap-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all font-bold"
          >
            <BoxIcon className="h-4 w-4" />
            {l.presets}
          </Button>
        </div>
      ) : (
      <div className="space-y-3">
        {consumables.map((item) => {
          const daysLeft = calculateDaysUntilEmpty(item);
          const alertLevel = getAlertLevel(daysLeft);

          return (
            <div
              key={item.id}
              className="group rounded-3xl border border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-[#1a3d32]/30 p-4 transition-all hover:bg-black/[0.01] dark:hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3.5 mb-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black/[0.02] dark:bg-white/[0.05] text-2xl transition-all group-hover:scale-105">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-foreground truncate tracking-tight">
                    {item.name}
                  </p>
                  <p className="text-[12px] text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="font-bold text-foreground/70">{item.currentStock.toFixed(1)} {item.unit}</span>
                    <span className="opacity-30">•</span>
                    <span>{item.dailyConsumption} {l.perDay}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <div
                    className={cn(
                      "flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      alertLevel === "danger" && "bg-destructive/10 text-destructive border border-destructive/10",
                      alertLevel === "warning" && "bg-orange-500/10 text-orange-600 dark:text-orange-300 border border-orange-500/10",
                      alertLevel === "ok" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10"
                    )}
                  >
                    {daysLeft === Infinity ? "∞" : `${daysLeft}${l.daysLeft}`}
                  </div>
                  <button 
                    onClick={() => openEdit(item)} 
                    className="h-8 w-8 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] transition-all flex items-center justify-center active:scale-90"
                  >
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="mb-4 px-0.5">
                <div className="h-2 rounded-full bg-black/[0.04] dark:bg-white/[0.06] overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      alertLevel === "danger" && "bg-destructive",
                      alertLevel === "warning" && "bg-orange-500",
                      alertLevel === "ok" && "bg-emerald-500"
                    )}
                    style={{
                      width: `${Math.min(
                        100,
                        (item.currentStock / (item.minStock * 3)) * 100
                      )}%`
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-10 rounded-2xl gap-2 text-xs bg-white dark:bg-white/5 border-black/[0.04] dark:border-white/[0.08] shadow-sm font-bold active:scale-95 transition-all hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                  onClick={() => handleDebit(item.id)}
                >
                  <Minus className="h-3.5 w-3.5" />
                  {l.debit}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-10 rounded-2xl gap-2 text-xs bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold active:scale-95 transition-all hover:bg-emerald-500/10"
                  onClick={() => handleAddStock(item.id, 1)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {l.restock}
                </Button>

                {alertLevel !== "ok" && (
                  <Button
                    size="sm"
                    className="h-10 w-10 rounded-2xl p-0 bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                    onClick={() => handleAddToShopping(item)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Modern Action Bar */}
      <div className="pt-2 flex flex-col gap-2.5">
        <Button
          onClick={() => setScreen("add")}
          className="w-full h-12 rounded-[1.25rem] gap-2.5 bg-black/[0.03] dark:bg-[#11302c] border border-black/[0.04] dark:border-emerald-500/20 hover:bg-black/[0.06] dark:hover:bg-emerald-500/10 text-foreground font-bold text-sm transition-all active:scale-[0.98]"
        >
          <PlusCircle className="h-4 w-4 text-emerald-500" />
          {language === 'pt-BR' ? 'Adicionar Novo' : 'Add New'}
        </Button>
        
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            variant="ghost"
            onClick={() => setScreen("presets")}
            className="flex-1 h-11 rounded-xl gap-2 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs"
          >
            <BoxIcon className="h-3.5 w-3.5" />
            {l.presets}
          </Button>

          <Button
            variant="ghost"
            onClick={() => setShowClearConfirm(true)}
            className="flex-1 h-11 rounded-xl gap-2 text-destructive hover:bg-destructive/10 font-bold text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {l.clearAll}
          </Button>
        </div>
      </div>

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent className="rounded-[1.5rem]">
          <AlertDialogTitle>{l.clearAll}</AlertDialogTitle>
          <AlertDialogDescription>{l.clearConfirm}</AlertDialogDescription>
          <div className="flex gap-2 justify-end mt-4">
            <AlertDialogCancel className="rounded-xl border-2 font-bold">{l.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold"
              onClick={async () => {
                await clearConsumables();
                toast.success(l.cleared);
                setShowClearConfirm(false);
              }}
            >
              {l.confirm}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  const presets: Record<string, { label: string; items: Omit<ConsumableItem, 'id'>[] }> = {
    bathroom: {
      label: l.bathroom,
      items: [
        { name: "Papel Higiênico", icon: "🧻", category: "hygiene", currentStock: 12, unit: "rolos", dailyConsumption: 0.5, minStock: 4, usageInterval: "daily" },
        { name: "Sabonete", icon: "🧼", category: "hygiene", currentStock: 3, unit: "unidades", dailyConsumption: 0.15, minStock: 1, usageInterval: "daily" },
        { name: "Pasta de Dente", icon: "🪥", category: "hygiene", currentStock: 2, unit: "tubos", dailyConsumption: 0.05, minStock: 1, usageInterval: "daily" },
        { name: "Shampoo", icon: "🧴", category: "hygiene", currentStock: 1, unit: "unidades", dailyConsumption: 0.03, minStock: 1, usageInterval: "daily" },
      ],
    },
    kitchen: {
      label: l.kitchen,
      items: [
        { name: "Papel Toalha", icon: "🧺", category: "kitchen", currentStock: 4, unit: "rolos", dailyConsumption: 0.5, minStock: 2, usageInterval: "daily" },
        { name: "Detergente", icon: "🧴", category: "kitchen", currentStock: 2, unit: "unidades", dailyConsumption: 0.1, minStock: 1, usageInterval: "daily" },
        { name: "Esponja", icon: "🧽", category: "kitchen", currentStock: 3, unit: "unidades", dailyConsumption: 0.07, minStock: 1, usageInterval: "daily" },
        { name: "Saco de Lixo", icon: "🗑️", category: "kitchen", currentStock: 30, unit: "unidades", dailyConsumption: 1, minStock: 5, usageInterval: "daily" },
      ],
    },
    cleaning: {
      label: l.cleaning,
      items: [
        { name: "Desinfetante", icon: "🫧", category: "cleaning", currentStock: 2, unit: "L", dailyConsumption: 0.05, minStock: 1, usageInterval: "daily" },
        { name: "Água Sanitária", icon: "🧪", category: "cleaning", currentStock: 2, unit: "L", dailyConsumption: 0.03, minStock: 1, usageInterval: "daily" },
        { name: "Limpador Multiuso", icon: "🧹", category: "cleaning", currentStock: 1, unit: "unidades", dailyConsumption: 0.03, minStock: 1, usageInterval: "daily" },
        { name: "Amaciante", icon: "🧺", category: "cleaning", currentStock: 2, unit: "L", dailyConsumption: 0.05, minStock: 1, usageInterval: "daily" },
      ],
    },
    personal: {
      label: l.personal,
      items: [
        { name: "Desodorante", icon: "🧴", category: "hygiene", currentStock: 1, unit: "unidades", dailyConsumption: 0.03, minStock: 1, usageInterval: "daily" },
        { name: "Protetor Solar", icon: "☀️", category: "hygiene", currentStock: 1, unit: "tubos", dailyConsumption: 0.02, minStock: 1, usageInterval: "daily" },
        { name: "Fio Dental", icon: "🪥", category: "hygiene", currentStock: 2, unit: "unidades", dailyConsumption: 0.02, minStock: 1, usageInterval: "daily" },
        { name: "Lâmina de Barbear", icon: "🪒", category: "hygiene", currentStock: 4, unit: "unidades", dailyConsumption: 0.14, minStock: 2, usageInterval: "daily" },
      ],
    },
    complete: {
      label: l.complete,
      items: [
        { name: "Papel Higiênico", icon: "🧻", category: "hygiene", currentStock: 12, unit: "rolos", dailyConsumption: 0.5, minStock: 4, usageInterval: "daily" },
        { name: "Papel Toalha", icon: "🧺", category: "kitchen", currentStock: 4, unit: "rolos", dailyConsumption: 0.5, minStock: 2, usageInterval: "daily" },
        { name: "Detergente", icon: "🧴", category: "kitchen", currentStock: 2, unit: "unidades", dailyConsumption: 0.1, minStock: 1, usageInterval: "daily" },
        { name: "Sabonete", icon: "🧼", category: "hygiene", currentStock: 3, unit: "unidades", dailyConsumption: 0.15, minStock: 1, usageInterval: "daily" },
        { name: "Pasta de Dente", icon: "🪥", category: "hygiene", currentStock: 2, unit: "tubos", dailyConsumption: 0.05, minStock: 1, usageInterval: "daily" },
        { name: "Esponja", icon: "🧽", category: "kitchen", currentStock: 3, unit: "unidades", dailyConsumption: 0.07, minStock: 1, usageInterval: "daily" },
        { name: "Saco de Lixo", icon: "🗑️", category: "kitchen", currentStock: 30, unit: "unidades", dailyConsumption: 1, minStock: 5, usageInterval: "daily" },
        { name: "Desinfetante", icon: "🫧", category: "cleaning", currentStock: 2, unit: "L", dailyConsumption: 0.05, minStock: 1, usageInterval: "daily" },
      ],
    },
  };

  const handleLoadPreset = (presetKey: string) => {
    const preset = presets[presetKey];
    if (!preset) return;
    const existingNames = consumables.map(c => c.name.toLowerCase());
    const newItems = preset.items.filter(item => !existingNames.includes(item.name.toLowerCase()));
    if (newItems.length > 0) {
      setConsumablesBulk(newItems);
    }
    toast.success(l.loaded);
    setScreen("list");
  };

  const renderPresetsScreen = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3.5 pb-2">
        <button
          onClick={() => setScreen("list")}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] transition-all active:scale-95"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h2 className="text-lg font-black text-foreground tracking-tight">{l.presets}</h2>
          <p className="text-[12px] text-muted-foreground font-medium">{l.presetsDesc}</p>
        </div>
      </div>

      <div className="space-y-3.5">
        {Object.entries(presets).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => handleLoadPreset(key)}
            className="w-full rounded-[1.75rem] border border-black/[0.03] dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-5 text-left transition-all active:scale-[0.98] hover:shadow-md hover:border-emerald-500/20 group"
          >
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-[15px] font-black text-foreground group-hover:text-emerald-600 transition-colors">{preset.label}</h3>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                {preset.items.length} itens
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {preset.items.map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded-xl border border-black/[0.02] dark:border-white/[0.02]">
                  {item.icon} {item.name}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const content = (
    <div className={cn("pb-10", inline ? "px-1.5 py-1" : "px-5 py-4")}>
      {screen === "list" && renderListScreen()}
      {screen === "add" && renderAddScreen()}
      {screen === "edit" && renderEditScreen()}
      {screen === "custom" && renderCustomScreen()}
      {screen === "presets" && renderPresetsScreen()}
    </div>
  );

  if (inline) return content;

  return (
    <Sheet open={open} onOpenChange={(val) => { if (!val && onClose) onClose(); }}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
        <SheetHeader className="border-b border-gray-200 px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-lg font-bold">
            <TrendingDown className="h-5 w-5 text-primary" />
            {l.title}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(90vh-80px)]">
          {content}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
