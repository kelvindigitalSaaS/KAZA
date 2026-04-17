import React from "react";
import { Link } from "react-router-dom";

export default function SalesPrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F0F5F3] font-sans text-[#0A241D] relative overflow-hidden">
      {/* iOS 26 Glass Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[-10%] w-[60vw] h-[60vw] bg-emerald-200/30 rounded-full blur-[120px] mix-blend-multiply"></div>
        <div className="absolute bottom-[0%] right-[10%] w-[40vw] h-[40vw] bg-[#1A5C4A]/10 rounded-full blur-[100px] mix-blend-multiply"></div>
      </div>

      <header className="fixed top-0 inset-x-0 bg-white/40 backdrop-blur-[40px] z-50 border-b border-white/50 shadow-sm saturate-150">
        <div className="max-w-[1000px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/pagina-de-vendas" className="flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-[#1A5C4A] p-2 rounded-lg">
            <img src="/src/assets/logo inicial nome.svg" alt="Kaza Logo" className="h-8" />
          </Link>
          <Link to="/auth" className="bg-[#0A241D]/90 backdrop-blur-md border border-white/10 text-emerald-50 px-6 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5C4A]">
            Começar Grátis
          </Link>
        </div>
      </header>

      <main className="relative z-10 pt-36 pb-24 max-w-[800px] mx-auto px-6">
        <div className="bg-white/60 backdrop-blur-[60px] saturate-[1.8] rounded-[2.5rem] p-10 lg:p-16 shadow-[0_8px_32px_0_rgba(10,36,29,0.05)] border border-white">
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-[#0A241D] mb-4">Política de Privacidade</h1>
          <p className="text-gray-500 font-medium mb-12">Última atualização: Abril de 2026</p>

          <div className="space-y-8 text-gray-700 leading-relaxed font-medium">
            <section>
              <h2 className="text-2xl font-bold text-[#0A241D] mb-4">1. Informações que Coletamos</h2>
              <p>A Kaza coleta informações para fornecer serviços melhores e mais personalizados aos nossos usuários. Nós coletamos apenas o necessário para garantir o funcionamento do gerenciador doméstico (estoque, notificações de validade e afins).</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-[#0A241D] mb-4">2. Como Usamos as Informações</h2>
              <p>Nós utilizamos os dados da sua despensa para gerar alertas de validade de maneira local e na nuvem. A Inteligência Artificial de receitas cruza apenas seus itens anonimizados para evitar qualquer identificação pessoal durante a geração textual.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-[#0A241D] mb-4">3. Segurança dos Dados</h2>
              <p>Sua segurança é primordial. Trabalhamos com servidores de ponta (Supabase) que garantem a criptografia de dados em trânsito e em repouso. Nenhum dado de consumo será vendido para plataformas terceiras de marketing indesejado.</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
