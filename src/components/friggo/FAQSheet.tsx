import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { HelpCircle, Mail } from "lucide-react";

interface FAQSheetProps {
  open: boolean;
  onClose: () => void;
}

const faqData = {
  "pt-BR": {
    title: "Perguntas Frequentes",
    notFound: "Não encontrou sua resposta?",
    items: [
      {
        question: "Como adiciono um item à geladeira?",
        answer:
          'Vá até a aba "Estoque" e toque no botão "+" no canto inferior. Agora você pode adicionar quantidades fracionadas (ex: 0.5kg ou 1.5 unidades) para um controle mais preciso.'
      },
      {
        question: "Como funciona o alerta de vencimento?",
        answer:
          "O Kaza monitora as datas de validade de todos os seus itens e envia notificações. Além disso, se você guardar carnes na dispensa em vez da geladeira, o Kaza enviará um alerta de perigo imediato."
      },
      {
        question: "O que é o check-up noturno?",
        answer:
          "O check-up noturno é uma rotina diária onde você pode registrar o que consumiu. Isso ajuda a manter o controle atualizado e permite que o algoritmo inteligente sugira reposições."
      },
      {
        question: "Como funciona o rastreamento de consumíveis?",
        answer:
          "Para itens como papel higiênico ou detergente, você define o estoque atual e o consumo médio. O app aceita números decimais e avisa exatamente quando você precisa comprar mais."
      },
      {
        question: "Como funcionam as receitas inteligentes?",
        answer:
          "Baseado nos itens que você tem, especialmente os que estão próximos de vencer, o Kaza sugere receitas exclusivas para aproveitar tudo sem desperdício."
      },
      {
        question: "Como gerenciar minha assinatura?",
        answer:
          'Em Configurações > Assinatura, você pode ver seus detalhes, histórico de pagamentos e fazer upgrade para o Plano Premium por apenas R$ 27,00.'
      },
      {
        question: "Como funciona o lembrete do lixo?",
        answer:
          "Configure os dias da semana e o horário programado nas Configurações. O Kaza avisa você no mesmo dia (ou antes) para não esquecer de descer ou colocar o lixo para fora."
      },
      {
        question: "Como instalar o Kaza no celular?",
        answer:
          "O Kaza é um PWA. Vá em Configurações > Como Instalar para ver o passo a passo para Android (Chrome) e iPhone (Safari)."
      }
    ]
  },
  en: {
    title: "Frequently Asked Questions",
    notFound: "Didn't find your answer?",
    items: [
      {
        question: "How do I add an item to the fridge?",
        answer:
          'Go to the "Pantry" tab and tap the "+" button at the bottom. You can scan the barcode or manually enter product information.'
      },
      {
        question: "How does the expiration alert work?",
        answer:
          "Kaza monitors expiration dates of all your items and sends notifications when a product is about to expire. You can configure how many days in advance you want to be alerted in settings."
      },
      {
        question: "What is the nightly check-up?",
        answer:
          "The nightly check-up is a daily routine where you can log what you consumed during the day. This helps keep inventory updated and predict when you'll need to buy more."
      },
      {
        question: "How does consumables tracking work?",
        answer:
          "For daily use items like toilet paper, you can set the average daily consumption. The app automatically calculates when you'll need to buy more and adds to shopping list."
      },
      {
        question: "How do smart recipes work?",
        answer:
          "Based on items you have in the fridge, especially those close to expiring, Kaza suggests recipes to use everything without waste."
      },
      {
        question: "Can I share my shopping list?",
        answer:
          'Yes! In the "List" tab, tap the share icon to send your list via WhatsApp or email.'
      },
      {
        question: "What do maturation levels mean?",
        answer:
          "Green = not yet ripe; Ripe = ready to eat; Very Ripe = consume soon; Overripe = may not be good for consumption."
      },
      {
        question: "How do I change my plan?",
        answer: "Go to Settings > My Plan to see available options and upgrade."
      },
      {
        question: "How to connect Alexa or Google?",
        answer:
          "In Settings > Integrations > Voice Assistants, you'll find instructions to connect your Alexa, Google Assistant, or Siri."
      },
      {
        question: "Is data synced across devices?",
        answer:
          "Yes! Your data is saved in the cloud and automatically synced across all devices where you log in."
      },
      {
        question: "How does garbage reminder work?",
        answer:
          "Set the days of the week garbage is collected on your street. The app sends a reminder the night before to take out the trash."
      },
      {
        question: "What is smart fridge?",
        answer:
          "If you have a smart refrigerator (Samsung, LG, etc), you can connect it to Kaza to control temperature, receive door-open alerts, and defrost reminders."
      }
    ]
  },
  es: {
    title: "Preguntas Frecuentes",
    notFound: "¿No encontraste tu respuesta?",
    items: [
      {
        question: "¿Cómo agrego un artículo a la nevera?",
        answer:
          'Ve a la pestaña "Despensa" y toca el botón "+" en la parte inferior. Puedes escanear el código de barras o ingresar manualmente la información del producto.'
      },
      {
        question: "¿Cómo funciona la alerta de vencimiento?",
        answer:
          "Kaza monitorea las fechas de vencimiento de todos tus artículos y envía notificaciones cuando un producto está por caducar. Puedes configurar cuántos días antes quieres ser alertado en ajustes."
      },
      {
        question: "¿Qué es el chequeo nocturno?",
        answer:
          "El chequeo nocturno es una rutina diaria donde puedes registrar lo que consumiste durante el día. Esto ayuda a mantener el inventario actualizado y predecir cuándo necesitarás comprar más."
      },
      {
        question: "¿Cómo funciona el seguimiento de consumibles?",
        answer:
          "Para artículos de uso diario como papel higiénico, puedes establecer el consumo diario promedio. La app calcula automáticamente cuándo necesitarás comprar más y lo agrega a la lista de compras."
      },
      {
        question: "¿Cómo funcionan las recetas inteligentes?",
        answer:
          "Basándose en los artículos que tienes en la nevera, especialmente los que están por vencer, Kaza sugiere recetas para aprovechar todo sin desperdicios."
      },
      {
        question: "¿Puedo compartir mi lista de compras?",
        answer:
          '¡Sí! En la pestaña "Lista", toca el ícono de compartir para enviar tu lista por WhatsApp o email.'
      },
      {
        question: "¿Qué significan los niveles de maduración?",
        answer:
          "Verde = aún no maduro; Maduro = listo para comer; Muy Maduro = consumir pronto; Pasado = puede no estar bueno para consumo."
      },
      {
        question: "¿Cómo cambio mi plan?",
        answer:
          "Ve a Ajustes > Mi Plan para ver las opciones disponibles y hacer upgrade."
      },
      {
        question: "¿Cómo conectar Alexa o Google?",
        answer:
          "En Ajustes > Integraciones > Asistentes de Voz, encontrarás las instrucciones para conectar tu Alexa, Google Assistant o Siri."
      },
      {
        question: "¿Los datos se sincronizan entre dispositivos?",
        answer:
          "¡Sí! Tus datos se guardan en la nube y se sincronizan automáticamente en todos los dispositivos donde inicies sesión."
      },
      {
        question: "¿Cómo funciona el recordatorio de basura?",
        answer:
          "Configura los días de la semana que pasa el recolector de basura en tu calle. La app envía un recordatorio la noche anterior para sacar la basura."
      },
      {
        question: "¿Qué es la nevera smart?",
        answer:
          "Si tienes una nevera inteligente (Samsung, LG, etc), puedes conectarla a Kaza para controlar temperatura, recibir alertas de puerta abierta y recordatorios de descongelación."
      }
    ]
  }
};

export function FAQSheet({ open, onClose }: FAQSheetProps) {
  const { language } = useLanguage();
  const data = faqData[language];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0">
        <SheetHeader className="px-4 pt-5 pb-2">
          <SheetTitle className="flex items-center gap-2 text-lg font-bold">
            <HelpCircle className="h-5 w-5 text-primary" />
            {data.title}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(90vh-80px)]">
          <div className="px-4 py-5 pb-10">
            <Accordion type="single" collapsible className="space-y-2">
              {data.items.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="rounded-md border border-border bg-card px-4 data-[state=open]:bg-primary/5"
                >
                  <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-4">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-500 pb-4">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-6 rounded-md bg-muted/50 p-4 text-center">
              <p className="text-sm text-gray-500">{data.notFound}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Mail className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-primary">
                  suporte@kaza.app
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
