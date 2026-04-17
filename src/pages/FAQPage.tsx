import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { ChevronLeft, HelpCircle, Mail, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { SUPPORT_CONFIG } from "@/config/support";

const faqData = {
  "pt-BR": {
    title: "FAQ",
    subtitle: "Dúvidas Frequentes",
    notFound: "Não encontrou sua resposta?",
    supportMsg: "Fale com nosso suporte",
    items: [
      {
        question: "Como adiciono um item à geladeira?",
        answer: 'Vá até a aba "Estoque" e toque no botão "+" no canto inferior. Agora você pode adicionar quantidades fracionadas (ex: 0.5kg ou 1.5 unidades) para um controle mais preciso.'
      },
      {
        question: "Como funciona o alerta de vencimento?",
        answer: "O Kaza monitora as datas de validade de todos os seus itens e envia notificações. Além disso, se você guardar carnes na dispensa em vez da geladeira, o Kaza enviará um alerta de perigo imediato."
      },
      {
        question: "O que é o check-up noturno?",
        answer: "O check-up noturno é uma rotina diária onde você pode registrar o que consumiu. Isso ajuda a manter o controle atualizado e permite que o algoritmo inteligente sugira reposições."
      },
      {
        question: "Como funciona o rastreamento de consumíveis?",
        answer: "Para itens como papel higiênico ou detergente, você define o estoque atual e o consumo médio. O app aceita números decimais e avisa exatamente quando você precisa comprar mais."
      },
      {
        question: "Como funcionam as receitas inteligentes?",
        answer: "Baseado nos itens que você tem, especialmente os que estão próximos de vencer, o Kaza sugere receitas exclusivas para aproveitar tudo sem desperdício."
      },
      {
        question: "Como gerenciar minha assinatura?",
        answer: 'Em Configurações > Assinatura, você pode ver seus detalhes, histórico de pagamentos e fazer upgrade para o Plano Premium por apenas R$ 27,00.'
      },
      {
        question: "Como funciona o lembrete do lixo?",
        answer: "Configure os dias da semana e o horário programado nas Configurações. O Kaza avisa você no mesmo dia (ou antes) para não esquecer de descer ou colocar o lixo para fora."
      },
      {
        question: "Como instalar o Kaza no celular?",
        answer: "O Kaza é um PWA. Vá em Configurações > Como Instalar para ver o passo a passo para Android (Chrome) e iPhone (Safari)."
      }
    ]
  },
  en: {
    title: "FAQ",
    subtitle: "Frequently Asked Questions",
    notFound: "Didn't find your answer?",
    supportMsg: "Contact support",
    items: [
      {
        question: "How do I add an item to the fridge?",
        answer: 'Go to the "Pantry" tab and tap the "+" button at the bottom. You can scan the barcode or manually enter product information.'
      },
      {
        question: "How does the expiration alert work?",
        answer: "Kaza monitors expiration dates of all your items and sends notifications when a product is about to expire."
      },
      {
        question: "What is the nightly check-up?",
        answer: "The nightly check-up is a daily routine where you can log what you consumed during the day."
      },
      {
        question: "How does consumables tracking work?",
        answer: "For daily use items like toilet paper, you can set the average daily consumption."
      },
      {
        question: "How do smart recipes work?",
        answer: "Based on items you have, especially those close to expiring, Kaza suggests recipes to use everything without waste."
      }
    ]
  },
  es: {
    title: "FAQ",
    subtitle: "Preguntas Frecuentes",
    notFound: "¿No encontraste tu respuesta?",
    supportMsg: "Hablar con soporte",
    items: [
      {
        question: "¿Cómo agrego un artículo a la nevera?",
        answer: 'Ve a la pestaña "Despensa" y toca el botón "+" en la parte inferior.'
      },
      {
        question: "¿Cómo funciona la alerta de vencimiento?",
        answer: "Kaza monitorea las fechas de vencimiento de todos tus artículos y envía notificaciones."
      }
    ]
  }
};

export default function FAQPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const data = faqData[language as keyof typeof faqData] || faqData.en;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#091f1c] pb-10">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#091f1c]/80 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.06] px-4 h-16 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-foreground transition-all active:scale-90"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-foreground">{data.title}</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary/10 mb-2">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-foreground">{data.subtitle}</h2>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {data.items.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="rounded-[1.5rem] border border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-white/5 px-6 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="text-left font-bold text-[15px] hover:no-underline py-5 text-foreground">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 font-medium leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <section className="mt-8 rounded-[2rem] bg-white/50 dark:bg-white/5 border border-dashed border-black/[0.1] dark:border-white/[0.1] p-8 text-center">
          <p className="text-sm font-bold text-muted-foreground mb-4">{data.notFound}</p>
          <div className="flex flex-col gap-3">
            <a 
              href={`mailto:${SUPPORT_CONFIG.email}`}
              className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-muted/50 text-foreground font-bold text-sm transition-all active:scale-95"
            >
              <Mail className="h-4 w-4 text-primary" />
              {SUPPORT_CONFIG.email}
            </a>
            <a 
              href={SUPPORT_CONFIG.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-primary/10 text-primary font-bold text-sm transition-all active:scale-95 no-underline"
            >
              <MessageCircle className="h-4 w-4" />
              {data.supportMsg}
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
