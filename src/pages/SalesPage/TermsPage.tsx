import React from "react";
import { Link } from "react-router-dom";

export default function SalesTermsPage() {
  return (
    <div className="min-h-screen bg-[#F0F5F3] font-sans text-[#0A241D] relative overflow-hidden">
      {/* iOS 26 Glass Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-300/20 rounded-full blur-[100px] mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-teal-300/20 rounded-full blur-[100px] mix-blend-multiply"></div>
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
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-[#0A241D] mb-4">Termos de Uso</h1>
          <p className="text-gray-500 font-medium mb-12">Última atualização: Abril de 2026</p>

          <div className="space-y-8 text-gray-700 leading-relaxed font-medium">
            <section>
              <h2 className="text-2xl font-bold text-[#0A241D] mb-4">1. Aceitação</h2>
              <p>Ao acessar e usar a plataforma Kaza, você concorda em cumprir estes termos de serviço e todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de usar ou acessar este site.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-[#0A241D] mb-4">2. Licença de Uso</h2>
              <p>É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no aplicativo Kaza, apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título, e sob esta licença você não pode:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Modificar ou copiar os materiais;</li>
                <li>Tentar descompilar ou fazer engenharia reversa de qualquer software contido no app Kaza;</li>
                <li>Remover quaisquer direitos autorais ou outras notações de propriedade dos materiais; ou</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-[#0A241D] mb-4">3. Limitações</h2>
              <p>Em nenhum caso a Kaza ou seus fornecedores serão responsáveis por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro ou devido a interrupção dos negócios) decorrentes do uso ou da incapacidade de usar os materiais da nossa plataforma.</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
