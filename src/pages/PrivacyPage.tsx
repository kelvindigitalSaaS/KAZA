import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronLeft, Shield, Lock, Eye, FileText, CheckCircle2, CreditCard, Scale, AlertCircle, Mail } from "lucide-react";
import { motion } from "framer-motion";

const TERMS_DATA = {
  "pt-BR": {
    title: "Termos de Uso",
    subtitle: "Termos de Uso e Privacidade",
    lastUpdate: "Última atualização: Abril de 2026",
    intro: "Bem-vindo ao Kaza. Ao acessar ou usar nosso aplicativo, você concorda com estes Termos de Uso. Leia com atenção antes de continuar.",
    sections: [
      {
        icon: CheckCircle2,
        title: "1. Aceitação dos Termos",
        content: "Ao criar uma conta ou utilizar qualquer funcionalidade do Kaza, você confirma que leu, compreendeu e concorda com estes Termos de Uso e com nossa Política de Privacidade. Caso não concorde, não utilize o aplicativo."
      },
      {
        icon: FileText,
        title: "2. Descrição do Serviço",
        content: "O Kaza é um aplicativo de gestão doméstica que permite controlar itens da geladeira/despensa, criar listas de compras, gerenciar consumíveis (higiene, limpeza, cozinha), planejar refeições semanais e receber lembretes personalizados. O serviço é oferecido em versão gratuita com período de teste e em planos pagos com recursos adicionais."
      },
      {
        icon: Shield,
        title: "3. Cadastro e Responsabilidade da Conta",
        content: "Você é responsável por manter a confidencialidade de suas credenciais de acesso. Qualquer atividade realizada em sua conta é de sua responsabilidade. Informe imediatamente qualquer uso não autorizado. O Kaza não se responsabiliza por danos causados pelo compartilhamento indevido de credenciais."
      },
      {
        icon: Eye,
        title: "4. Privacidade e Proteção de Dados (LGPD)",
        content: "Seus dados são tratados conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). Coletamos apenas os dados necessários para a prestação do serviço: nome, e-mail, CPF (para vínculo do período de testes), preferências domésticas e itens inseridos manualmente. Seus dados não são vendidos ou compartilhados com terceiros sem consentimento. Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento pelo e-mail de suporte."
      },
      {
        icon: CreditCard,
        title: "5. Pagamentos e Cancelamento",
        content: "Os pagamentos são processados de forma segura pela plataforma Cakto, com suporte a PIX e cartões de crédito. O CPF é utilizado exclusivamente para fins de identificação junto ao processador de pagamentos, nunca sendo exposto em URLs ou logs. Você pode cancelar sua assinatura a qualquer momento, sem multa. O acesso Premium permanece ativo até o fim do período pago. Não há reembolso de períodos parciais, salvo determinação legal."
      },
      {
        icon: Lock,
        title: "6. Propriedade Intelectual",
        content: "Todo o conteúdo do Kaza — incluindo código-fonte, design, logotipos, textos, receitas geradas por IA e funcionalidades — é propriedade exclusiva do Kaza. É proibida a reprodução, distribuição ou uso comercial sem autorização prévia por escrito."
      },
      {
        icon: AlertCircle,
        title: "7. Limitação de Responsabilidade",
        content: "O Kaza é fornecido 'como está', sem garantias de disponibilidade contínua. Não nos responsabilizamos por perdas de dados, falhas de sincronização ou danos indiretos decorrentes do uso do aplicativo. Em nenhuma hipótese nossa responsabilidade excederá o valor pago pelo usuário nos últimos 12 meses."
      },
      {
        icon: FileText,
        title: "8. Alterações nos Termos",
        content: "Podemos atualizar estes Termos periodicamente. Alterações significativas serão notificadas via e-mail ou notificação no app com antecedência mínima de 15 dias. O uso continuado do serviço após as alterações constitui aceitação dos novos Termos."
      },
      {
        icon: Scale,
        title: "9. Foro e Legislação Aplicável",
        content: "Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de São Paulo — SP, com exclusão de qualquer outro, por mais privilegiado que seja, para dirimir quaisquer disputas decorrentes deste contrato."
      },
      {
        icon: Mail,
        title: "10. Contato",
        content: "Para dúvidas, solicitações de dados ou suporte, entre em contato: suporte@kaza.app. Respondemos em até 5 dias úteis. Para solicitações relacionadas à LGPD, o prazo de resposta é de 15 dias conforme exigido pela lei."
      },
    ],
    footer: "Ao usar o Kaza, você confirma que leu e concorda com estes Termos."
  },
  en: {
    title: "Terms of Use",
    subtitle: "Terms of Use & Privacy",
    lastUpdate: "Last updated: April 2026",
    intro: "Welcome to Kaza. By accessing or using our app, you agree to these Terms of Use. Please read carefully before proceeding.",
    sections: [
      {
        icon: CheckCircle2,
        title: "1. Acceptance of Terms",
        content: "By creating an account or using any Kaza feature, you confirm that you have read, understood, and agree to these Terms of Use and our Privacy Policy. If you do not agree, do not use the application."
      },
      {
        icon: FileText,
        title: "2. Service Description",
        content: "Kaza is a home management app that allows you to track fridge/pantry items, create shopping lists, manage consumables, plan weekly meals, and receive personalized reminders. The service is offered in a free tier with a trial period and paid plans with additional features."
      },
      {
        icon: Shield,
        title: "3. Account & Responsibility",
        content: "You are responsible for maintaining the confidentiality of your login credentials. Any activity performed on your account is your responsibility. Immediately notify us of any unauthorized use."
      },
      {
        icon: Eye,
        title: "4. Privacy & Data Protection",
        content: "We collect only the data necessary to provide the service: name, email, CPF (for trial linking), home preferences and manually entered items. Your data is never sold or shared with third parties without consent. You may request access, correction or deletion of your data at any time."
      },
      {
        icon: CreditCard,
        title: "5. Payments & Cancellation",
        content: "Payments are securely processed by Cakto, supporting PIX and credit cards. CPF is used solely for payment processor identification and is never exposed in URLs or logs. You may cancel your subscription at any time. No partial refunds, unless required by law."
      },
      {
        icon: Lock,
        title: "6. Intellectual Property",
        content: "All Kaza content — including source code, design, logos, texts and AI-generated recipes — is the exclusive property of Kaza. Reproduction or commercial use without prior written authorization is prohibited."
      },
      {
        icon: AlertCircle,
        title: "7. Limitation of Liability",
        content: "Kaza is provided 'as is', without guarantees of continuous availability. We are not liable for data loss, sync failures, or indirect damages. Our liability shall not exceed the amount paid by the user in the last 12 months."
      },
      {
        icon: FileText,
        title: "8. Changes to Terms",
        content: "We may update these Terms periodically. Significant changes will be notified via email or in-app notification at least 15 days in advance. Continued use of the service constitutes acceptance of the new Terms."
      },
      {
        icon: Scale,
        title: "9. Governing Law",
        content: "These Terms are governed by the laws of the Federative Republic of Brazil. The courts of São Paulo — SP are elected as the exclusive forum for any disputes arising from this agreement."
      },
      {
        icon: Mail,
        title: "10. Contact",
        content: "For questions, data requests or support: suporte@kaza.app. We respond within 5 business days."
      },
    ],
    footer: "By using Kaza, you confirm you have read and agree to these Terms."
  },
  es: {
    title: "Términos de Uso",
    subtitle: "Términos de Uso y Privacidad",
    lastUpdate: "Última actualización: Abril de 2026",
    intro: "Bienvenido a Kaza. Al acceder o usar nuestra aplicación, aceptas estos Términos de Uso.",
    sections: [
      {
        icon: CheckCircle2,
        title: "1. Aceptación de los Términos",
        content: "Al crear una cuenta o utilizar cualquier función de Kaza, confirmas que has leído y aceptas estos Términos de Uso y nuestra Política de Privacidad."
      },
      {
        icon: FileText,
        title: "2. Descripción del Servicio",
        content: "Kaza es una aplicación de gestión doméstica para controlar ítems del refrigerador/despensa, crear listas de compras, gestionar consumibles y planificar comidas semanales."
      },
      {
        icon: Eye,
        title: "3. Privacidad y Protección de Datos",
        content: "Recopilamos solo los datos necesarios para el servicio. Tus datos nunca se venden ni comparten con terceros sin tu consentimiento. Puedes solicitar acceso, corrección o eliminación de tus datos en cualquier momento."
      },
      {
        icon: CreditCard,
        title: "4. Pagos y Cancelación",
        content: "Los pagos se procesan de forma segura por Cakto. Puedes cancelar tu suscripción en cualquier momento sin penalización."
      },
      {
        icon: AlertCircle,
        title: "5. Limitación de Responsabilidad",
        content: "Kaza se proporciona 'tal cual', sin garantías de disponibilidad continua. Nuestra responsabilidad no excederá el importe pagado en los últimos 12 meses."
      },
      {
        icon: Mail,
        title: "6. Contacto",
        content: "Para soporte o consultas: suporte@kaza.app"
      },
    ],
    footer: "Al usar Kaza, confirmas que has leído y aceptas estos Términos."
  }
};

export default function PrivacyPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const data = TERMS_DATA[language as keyof typeof TERMS_DATA] || TERMS_DATA["pt-BR"];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#091f1c] pb-10">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#091f1c]/80 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.06] px-4 h-16 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 text-foreground transition-all active:scale-90"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-foreground">{data.title}</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 space-y-4 pb-8">
        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 p-6 text-center space-y-2"
        >
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-primary/10 mx-auto">
            <Scale className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-black text-foreground">{data.subtitle}</h2>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{data.lastUpdate}</p>
        </motion.div>

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-[1.5rem] bg-emerald-500/5 border border-emerald-500/15 p-5 flex gap-3"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 leading-relaxed">{data.intro}</p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-3">
          {data.sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <motion.section
                key={idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 + idx * 0.04 }}
                className="rounded-[1.5rem] border border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-white/5 p-5 shadow-sm"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="h-9 w-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <h3 className="font-black text-foreground text-[14px] leading-snug pt-1">{section.title}</h3>
                </div>
                <p className="text-[13px] text-muted-foreground font-medium leading-relaxed pl-12">
                  {section.content}
                </p>
              </motion.section>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="pt-4 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/8 border border-primary/15">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">{data.footer}</span>
          </div>
          <p className="text-[11px] text-muted-foreground/50 font-medium">Kaza Terms v2.0 — 2026</p>
        </footer>
      </main>
    </div>
  );
}
