import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Mic,
  Smartphone,
  Volume2,
  Settings2,
  ChevronDown,
  ChevronUp,
  Save,
  Copy,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

interface VoiceAssistantSettingsProps {
  open: boolean;
  onClose: () => void;
}

interface AssistantConfig {
  enabled: boolean;
  skillId?: string;
  deeplink?: string;
  shortcutName?: string;
}

const STORAGE_KEY = "friggo-voice-assistants";

/** Deep links disponíveis no app para configurar nos assistentes */
const APP_DEEPLINKS = [
  { label: "Abrir Início", url: "kaza://home" },
  { label: "Ver Geladeira", url: "kaza://home?tab=fridge" },
  { label: "Gerar Receitas", url: "kaza://home?tab=recipes" },
  { label: "Lista de Compras", url: "kaza://home?tab=shopping" },
  { label: "Adicionar Item", url: "kaza://add-item" },
  { label: "Notificações", url: "kaza://notifications" },
  { label: "Relatório Mensal", url: "kaza://monthly-report" }
];

const assistants = [
  {
    id: "alexa",
    name: "Amazon Alexa",
    description: "Amazon Echo, Alexa App",
    icon: "🔵",
    color: "bg-blue-100 dark:bg-blue-950/30",
    fieldLabel: "Alexa Skill ID",
    fieldKey: "skillId" as const,
    fieldPlaceholder: "Ex: amzn1.ask.skill.xxx-xxx",
    fieldHint: "Encontre no Alexa Developer Console → Your Skills → Skill ID",
    commands: [
      '"Alexa, abrir Kaza"',
      '"Alexa, o que tem na geladeira?"',
      '"Alexa, adicione leite na lista de compras"',
      '"Alexa, o que está vencendo?"'
    ],
    setupSteps: [
      "1. Acesse developer.amazon.com/alexa/console/ask",
      "2. Clique em 'Create Skill' → Custom → Start from scratch",
      "3. Nome da Skill: 'Kaza'",
      "4. Adicione intents: CheckFridgeIntent, AddItemIntent, CheckExpiringIntent",
      "5. No endpoint, use uma URL da sua API: https://kaza.app/api/alexa",
      "6. Copie o Skill ID e cole no campo acima",
      "7. Publique a Skill para uso pessoal ou na Alexa Skills Store"
    ]
  },
  {
    id: "google",
    name: "Google Assistente",
    description: "Google Home, Assistant App",
    icon: "🔴",
    color: "bg-red-50 dark:bg-red-950/30",
    fieldLabel: "Google Action / Deeplink",
    fieldKey: "deeplink" as const,
    fieldPlaceholder: "Ex: kaza://home",
    fieldHint:
      "Configure no Google Actions Console ou use os deep links abaixo",
    commands: [
      '"Ok Google, abrir Kaza"',
      '"Ok Google, adicionar item na geladeira"',
      '"Ok Google, sugerir receita"',
      '"Ok Google, minha lista de compras no Kaza"'
    ],
    setupSteps: [
      "1. Acesse console.actions.google.com",
      "2. Crie um novo projeto com nome 'Kaza'",
      "3. Em App Actions, adicione o actions.xml (já incluído no projeto Android)",
      "4. Configure os Built-in Intents: GET_THING, CREATE_THING",
      "5. Vincule os deep links: kaza://home, kaza://add-item",
      "6. Teste com 'gactions test' no terminal",
      "7. O app já responde a 'Ok Google, abrir Kaza' automaticamente"
    ]
  },
  {
    id: "siri",
    name: "Apple Siri",
    description: "iPhone, Apple Watch, HomePod",
    icon: "🟣",
    color: "bg-purple-50 dark:bg-purple-950/30",
    fieldLabel: "Nome do Atalho Siri",
    fieldKey: "shortcutName" as const,
    fieldPlaceholder: "Ex: Abrir Kaza",
    fieldHint: "Diga 'E aí Siri, abrir Kaza' ou crie atalhos personalizados",
    commands: [
      '"E aí Siri, abrir Kaza"',
      '"E aí Siri, [nome do atalho criado]"'
    ],
    setupSteps: [
      "1. A Siri já reconhece 'Abrir Kaza' automaticamente pelo nome do app",
      "2. Para comandos personalizados, abra o app 'Atalhos' (Shortcuts)",
      "3. Toque em '+' → Adicionar Ação → Abrir URL",
      "4. Cole um deep link (ex: kaza://home?tab=recipes)",
      "5. Dê um nome ao atalho (ex: 'Receitas do Kaza')",
      "6. Agora diga 'E aí Siri, Receitas do Kaza'"
    ]
  }
];

export function VoiceAssistantSettings({
  open,
  onClose
}: VoiceAssistantSettingsProps) {
  const [configs, setConfigs] = useState<Record<string, AssistantConfig>>({
    alexa: { enabled: false, skillId: "" },
    google: { enabled: false, deeplink: "" },
    siri: { enabled: false, shortcutName: "" }
  });
  const [expandedAssistant, setExpandedAssistant] = useState<string | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setConfigs(JSON.parse(saved));
        } catch { /* ignore parse errors */ }
      }
    }
  }, [open]);

  const handleToggle = (id: string) => {
    setConfigs((prev) => {
      const newState = {
        ...prev,
        [id]: { ...prev[id], enabled: !prev[id].enabled }
      };
      if (newState[id].enabled) {
        setExpandedAssistant(id);
        toast.info(
          `${
            assistants.find((a) => a.id === id)?.name
          } ativado! Configure abaixo.`
        );
      }
      return newState;
    });
  };

  const handleFieldChange = (id: string, key: string, value: string) => {
    setConfigs((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: value }
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Configurações dos assistentes salvas!");
      onClose();
    }, 500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Deep link copiado!");
      })
      .catch(() => {
        toast.error("Não foi possível copiar");
      });
  };

  const activeCount = Object.values(configs).filter((c) => c.enabled).length;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[92vh] rounded-t-3xl p-0 flex flex-col"
      >
        <SheetHeader className="border-b border-gray-200 dark:border-white/10 px-6 py-4 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-lg font-bold">
            <Mic className="h-5 w-5 text-primary" />
            Assistentes de Voz
            {activeCount > 0 && (
              <span className="ml-auto text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary px-2 py-1 rounded-full">
                {activeCount} ativo{activeCount !== 1 ? "s" : ""}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 pb-6">
          {/* Info Banner */}
          <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2 shrink-0">
                <Volume2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">
                  Controle por Voz
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Ative o assistente desejado, insira o ID/atalho e use comandos
                  de voz para controlar o Kaza.
                </p>
              </div>
            </div>
          </div>

          {/* Assistants List */}
          <div className="space-y-3">
            {assistants.map((assistant) => {
              const config = configs[assistant.id];
              const isExpanded = expandedAssistant === assistant.id;
              const fieldValue = config?.[assistant.fieldKey] || "";

              return (
                <div
                  key={assistant.id}
                  className="rounded-2xl border border-gray-200 dark:border-white/10 bg-card overflow-hidden"
                >
                  {/* Header row */}
                  <div className="flex items-center gap-3 p-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl shrink-0 ${assistant.color}`}
                    >
                      {assistant.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground text-sm">
                        {assistant.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {assistant.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config?.enabled ?? false}
                        onCheckedChange={() => handleToggle(assistant.id)}
                      />
                      <button
                        onClick={() =>
                          setExpandedAssistant(isExpanded ? null : assistant.id)
                        }
                        className="p-1 text-gray-400 hover:text-foreground transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded config */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-white/5 bg-muted/20 p-4 space-y-4">
                      {/* Config field */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {assistant.fieldLabel}
                        </Label>
                        <Input
                          value={fieldValue}
                          onChange={(e) =>
                            handleFieldChange(
                              assistant.id,
                              assistant.fieldKey,
                              e.target.value
                            )
                          }
                          placeholder={assistant.fieldPlaceholder}
                          className="h-11 rounded-xl bg-background border-gray-200 dark:border-white/10 text-sm"
                        />
                        <p className="text-[11px] text-gray-400">
                          💡 {assistant.fieldHint}
                        </p>
                      </div>

                      {/* Commands */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Comandos disponíveis
                        </p>
                        <div className="space-y-1.5">
                          {assistant.commands.map((cmd, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 rounded-xl bg-card border border-gray-100 dark:border-white/5 p-3"
                            >
                              <Mic className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="text-xs font-medium text-foreground">
                                {cmd}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-gray-400 italic">
                          + Mais comandos serão adicionados em breve
                        </p>
                      </div>

                      {/* Setup Steps */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Como configurar {assistant.name}
                        </p>
                        <div className="rounded-xl bg-card border border-gray-100 dark:border-white/5 p-3 space-y-1.5">
                          {assistant.setupSteps.map((step, index) => (
                            <p
                              key={index}
                              className="text-[11px] text-muted-foreground leading-relaxed"
                            >
                              {step}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Deep Links */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Deep Links do App
                        </p>
                        <div className="space-y-1.5">
                          {APP_DEEPLINKS.map((dl) => (
                            <div
                              key={dl.url}
                              className="flex items-center gap-2 rounded-xl bg-card border border-gray-100 dark:border-white/5 p-2.5"
                            >
                              <ExternalLink className="h-3 w-3 text-primary shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium text-foreground">
                                  {dl.label}
                                </p>
                                <p className="text-[10px] text-gray-400 font-mono truncate">
                                  {dl.url}
                                </p>
                              </div>
                              <button
                                onClick={() => copyToClipboard(dl.url)}
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0"
                              >
                                <Copy className="h-3.5 w-3.5 text-gray-400" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-gray-400">
                          📋 Copie e cole estes links na configuração do
                          assistente ou nos Atalhos do iPhone.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Notice */}
          <div className="flex items-start gap-3 rounded-2xl bg-muted/30 p-4">
            <Smartphone className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500">
              A integração completa estará disponível quando o Kaza for
              publicado na Play Store e App Store.
            </p>
          </div>

          {/* Como configurar */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-muted p-2 shrink-0">
                <Settings2 className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">
                  Como configurar
                </p>
                <ol className="mt-2 space-y-1 text-xs text-gray-500">
                  <li>1. Ative o assistente desejado acima</li>
                  <li>2. Preencha o ID/atalho no campo de configuração</li>
                  <li>3. Abra o app do assistente no seu celular</li>
                  <li>4. Vincule sua conta Kaza</li>
                  <li>5. Pronto! Use os comandos de voz</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-white/10 shrink-0">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-14 rounded-2xl font-black text-base"
          >
            {isSaving ? (
              "Salvando..."
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" /> Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
