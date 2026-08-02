import {
  Coffee,
  KeyRound,
  Users,
  Store,
  CalendarDays,
  ChefHat,
  ListChecks,
  Percent,
  TrendingUp,
  Save,
  Printer,
  Package,
  BookOpen,
  ShieldCheck,
  Lightbulb,
  ArrowRight,
  Upload,
  FileText,
  Pencil,
  Trash2,
  FolderOpen,
} from 'lucide-react'

function Passo({ num, children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-amber-700 text-white text-xs font-bold flex items-center justify-center mt-0.5">
        {num}
      </span>
      <span className="text-sm text-gray-700 leading-relaxed">{children}</span>
    </li>
  )
}

function Secao({ icon: Icon, titulo, intro, children, dica }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="bg-amber-700 rounded-xl p-2.5 shrink-0">
          <Icon size={22} className="text-white" />
        </div>
        <h3 className="text-lg font-bold text-amber-900">{titulo}</h3>
      </div>
      {intro && <p className="text-sm text-gray-600 mb-4 leading-relaxed">{intro}</p>}
      {children}
      {dica && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2">
          <Lightbulb size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 leading-relaxed"><strong>Dica:</strong> {dica}</p>
        </div>
      )}
    </div>
  )
}

export default function HelpManager() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-amber-900">Ajuda — Guia do CoffeeCraft</h2>
      </div>

      <div className="bg-white rounded-xl border border-amber-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-amber-700 rounded-xl p-2.5 shrink-0">
            <Coffee size={22} className="text-white" />
          </div>
          <h3 className="text-lg font-bold text-amber-900">O que é o CoffeeCraft?</h3>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          O CoffeeCraft é um programa que ajuda você a <strong>montar e enviar propostas de coffee break</strong>
          para clientes — com dia, horário, quantidade de participantes e todos os itens do café
          (salgados, doces e bebidas). Ele calcula os preços, gera o PDF bonito para mandar ao cliente
          e também um <strong>PDF de resultado financeiro</strong> (quanto você gasta e quanto ganha).
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          Nada de papel e caneta: você cadastra os dados uma vez e reaproveita sempre. As informações
          ficam <strong>salvas no servidor</strong> (no ar, em um banco de dados), então você pode usar
          de qualquer computador ou celular com internet.
        </p>
      </div>

      <Secao
        icon={KeyRound}
        titulo="Como entrar (login)"
        intro="O CoffeeCraft é protegido por uma senha, para que só você (e quem você autorizar) acesse."
      >
        <ol className="space-y-3">
          <Passo num={1}>Abra o endereço do site no navegador: <strong>cacir.com.br/coffeecraft</strong>.</Passo>
          <Passo num={2}>Na tela de entrada, digite a <strong>senha de acesso</strong> no campo indicado.</Passo>
          <Passo num={3}>Clique no botão <strong>“Entrar”</strong>.</Passo>
          <Passo num={4}>Pronto! Você vai ver o painel do programa com as abas no menu da esquerda.</Passo>
        </ol>
      </Secao>

      <Secao
        icon={Users}
        titulo="Clientes — cadastre quem compra de você"
        intro="Antes de montar uma proposta, é bom ter o cliente cadastrado. A aba “Clientes” guarda os dados dele."
      >
        <ol className="space-y-3">
          <Passo num={1}>Clique em <strong>Clientes</strong> no menu da esquerda.</Passo>
          <Passo num={2}>Clique no botão <strong>“Novo Cliente”</strong> (com o símbolo +).</Passo>
          <Passo num={3}>Preencha o <strong>Nome</strong> (obrigatório). Os outros campos — CPF, CNPJ, e-mail, telefone,
            contato e endereço — são opcionais e servem para ficar tudo organizado no mesmo lugar.</Passo>
          <Passo num={4}>Clique em <strong>“Salvar”</strong>. O cliente aparece na lista abaixo.</Passo>
          <Passo num={5}>Para mudar algo, use o lápis <Pencil size={14} className="inline text-amber-700" />.
            Para apagar, use a lixeira <Trash2 size={14} className="inline text-red-600" />.</Passo>
        </ol>
      </Secao>

      <Secao
        icon={Store}
        titulo="Configurações — as cafeterias que fornecem o café"
        intro="Aqui você cadastra as cafeterias (empresas/fornecedores) que preparam o coffee break. O nome e o local da cafeteria escolhida aparecem no topo do PDF da proposta."
      >
        <ol className="space-y-3">
          <Passo num={1}>Clique em <strong>Configurações</strong> no menu da esquerda.</Passo>
          <Passo num={2}>Clique em <strong>“Nova Cafeteria”</strong> e preencha: Nome, Local/Espaço (que vai na 2ª linha
            do PDF), CNPJ, telefone, e-mail, responsável e endereço.</Passo>
          <Passo num={3}>Clique em <strong>“Salvar”</strong>. Repita para cada cafeteria que você usa.</Passo>
        </ol>
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2">
          <Upload size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 leading-relaxed">
            <strong>Na mesma tela:</strong> o botão <strong>“Importar dados deste navegador”</strong> serve para
            trazer para o servidor os dados que já estavam salvos no seu computador (use uma vez só, na primeira
            vez). O botão <strong>“Baixar backup (JSON)”</strong> salva uma cópia de segurança dos dados no computador.
          </p>
        </div>
      </Secao>

      <Secao
        icon={Package}
        titulo="Produtos (Cardápio) — os itens do coffee break"
        intro="Cada item que você oferece — pão de queijo, mini sanduíche, café, suco... — precisa estar cadastrado aqui, com o preço de custo e o de venda."
      >
        <ol className="space-y-3">
          <Passo num={1}>Clique em <strong>Produtos</strong> no menu da esquerda.</Passo>
          <Passo num={2}>Clique em <strong>“Novo Item”</strong>.</Passo>
          <Passo num={3}>Preencha o <strong>nome</strong> do item, o <strong>Preço de Custo</strong> (quanto você paga
            para produzi-lo/comprá-lo) e o <strong>Preço de Venda</strong> (quanto você cobra do cliente).</Passo>
          <Passo num={4}>Escolha a <strong>Categoria</strong> (Salgados, Doces ou Bebidas — ou crie uma nova logo abaixo
            na lista de Categorias).</Passo>
          <Passo num={5}>Clique em <strong>“Salvar”</strong>.</Passo>
        </ol>
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2">
          <Lightbulb size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 leading-relaxed">
            <strong>Dica:</strong> a diferença entre o preço de venda e o de custo é o seu lucro por item. O programa
            usa esses números no PDF de Resultado Financeiro.
          </p>
        </div>
      </Secao>

      <Secao
        icon={BookOpen}
        titulo="Receitas — os pacotes prontos"
        intro="Uma receita é um “combo” pronto: um conjunto de itens com a quantidade por pessoa. Em vez de repetir o trabalho toda vez, você monta uma vez e aplica na proposta com um clique."
      >
        <ol className="space-y-3">
          <Passo num={1}>Clique em <strong>Receitas</strong> no menu da esquerda.</Passo>
          <Passo num={2}>Clique em <strong>“Nova Receita”</strong> e dê um nome (ex.: “Pacote Básico”).</Passo>
          <Passo num={3}>Na lista de produtos, escolha um item, digite a <strong>quantidade por pessoa</strong>
            (ex.: 1 pão de queijo por pessoa) e clique para adicionar.</Passo>
          <Passo num={4}>Adicione todos os itens do pacote e clique em <strong>“Salvar”</strong>.</Passo>
        </ol>
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2">
          <ChefHat size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 leading-relaxed">
            <strong>Importante:</strong> as receitas são só para você organizar o trabalho — elas não aparecem no PDF
            enviado ao cliente.
          </p>
        </div>
      </Secao>

      <Secao
        icon={FileText}
        titulo="Nova Proposta — o passo a passo completo"
        intro="Esta é a tela principal. Siga os passos de 1 a 9, na ordem de cima para baixo. Cada etapa tem o seu quadradinho no topo do menu lateral."
      >
        <div className="space-y-5">
          <div className="border-l-4 border-amber-700 pl-4">
            <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
              <Users size={16} className="text-amber-600" /> Etapa 1 — Cliente
            </h4>
            <ol className="space-y-2">
              <Passo num={1}>Se o cliente já está cadastrado, escolha na lista <strong>“Cliente”</strong> — o nome entra sozinho.</Passo>
              <Passo num={2}>Se não está, digite o nome direto no campo de texto.</Passo>
            </ol>
          </div>

          <div className="border-l-4 border-amber-700 pl-4">
            <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
              <Store size={16} className="text-amber-600" /> Etapa 2 — Cafeteria que fornecerá
            </h4>
            <ol className="space-y-2">
              <Passo num={1}>Escolha na lista qual cafeteria vai preparar o coffee break.</Passo>
              <Passo num={2}>O nome (e o local) dela aparece no topo do PDF. Se não escolher nenhuma, fica “☕ CoffeeCraft”.</Passo>
            </ol>
          </div>

          <div className="border-l-4 border-amber-700 pl-4">
            <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
              <CalendarDays size={16} className="text-amber-600" /> Etapa 3 — Datas e Horários (Eventos)
            </h4>
            <ol className="space-y-2">
              <Passo num={1}>Clique em <strong>“Adicionar Evento”</strong>.</Passo>
              <Passo num={2}>Preencha a <strong>data</strong>, o <strong>horário de início</strong> e o de <strong>fim</strong>
                (ex.: das 09:00 às 12:00) e o número de <strong>participantes</strong>.</Passo>
              <Passo num={3}>Se o café for em mais de um dia, clique em “Adicionar Evento” de novo — você pode ter
                quantos eventos quiser (Evento 1, Evento 2...).</Passo>
              <Passo num={4}>Para remover um evento, clique na lixeira dele.</Passo>
            </ol>
          </div>

          <div className="border-l-4 border-amber-700 pl-4">
            <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
              <ChefHat size={16} className="text-amber-600" /> Etapa 4 — Receita do Pacote
            </h4>
            <ol className="space-y-2">
              <Passo num={1}>Ou <strong>crie uma receita aqui mesmo</strong> (dê um nome e adicione os itens com as
                quantidades por pessoa) ou <strong>carregue uma receita pronta</strong> da lista.</Passo>
              <Passo num={2}>Clique em <strong>“Distribuir nos Dias”</strong>: o programa espalha os itens automaticamente
                pelos eventos. Bebidas vão para todos os eventos; comidas são distribuídas entre eles.</Passo>
            </ol>
          </div>

          <div className="border-l-4 border-amber-700 pl-4">
            <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
              <ListChecks size={16} className="text-amber-600" /> Etapa 5 — Itens por Dia
            </h4>
            <ol className="space-y-2">
              <Passo num={1}>Abaixo de cada evento, você vê a lista de itens. Pode <strong>adicionar itens</strong>
                (escolha o produto e a quantidade por pessoa) e <strong>remover</strong> quando quiser.</Passo>
              <Passo num={2}>Pode <strong>editar a quantidade</strong> direto no campo de cada item.</Passo>
            </ol>
          </div>

          <div className="border-l-4 border-amber-700 pl-4">
            <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
              <Percent size={16} className="text-amber-600" /> Etapa 6 — Taxa ou Desconto
            </h4>
            <ol className="space-y-2">
              <Passo num={1}>Se quiser cobrar uma taxa (ex.: 10%), escolha <strong>Percentual</strong> e digite o valor
                (ex.: 10). Para um valor fixo, escolha <strong>Valor Fixo</strong>.</Passo>
              <Passo num={2}>Para dar desconto, use um número <strong>negativo</strong> (ex.: -5).</Passo>
            </ol>
          </div>

          <div className="border-l-4 border-amber-700 pl-4">
            <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-amber-600" /> Etapa 7 — Resultado Financeiro
            </h4>
            <ol className="space-y-2">
              <Passo num={1}>Este card verde é só para você: mostra o <strong>custo total</strong>, a <strong>receita</strong>
                (venda + taxa) e o <strong>resultado</strong> (o que sobra).</Passo>
              <Passo num={2}>Margem = quanto percentualmente o lucro representa sobre o total. Nada disso vai no PDF do cliente.</Passo>
            </ol>
          </div>

          <div className="border-l-4 border-amber-700 pl-4">
            <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
              <Save size={16} className="text-amber-600" /> Etapa 8 — Salvar, Revisar e Histórico
            </h4>
            <ol className="space-y-2">
              <Passo num={1}>Clique em <strong>“Salvar Proposta”</strong>: o programa gera o <strong>número da proposta</strong>
                (ex.: 020826-01-R00) e guarda no histórico.</Passo>
              <Passo num={2}>Se o cliente pedir mudanças, clique em <strong>“Criar Revisão”</strong>: o número vira R01, R02...
                e a versão anterior fica salva no histórico.</Passo>
              <Passo num={3}>Na tabela <strong>Histórico</strong> você vê tudo salvo. Use a pasta <FolderOpen size={14} className="inline text-amber-700" /> para
                <strong>carregar</strong> uma proposta de volta e a lixeira para <strong>excluir</strong>.</Passo>
            </ol>
          </div>

          <div className="border-l-4 border-amber-700 pl-4">
            <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
              <Printer size={16} className="text-amber-600" /> Etapa 9 — Gerar os PDFs
            </h4>
            <ol className="space-y-2">
              <Passo num={1}><strong>“Gerar Proposta em PDF”</strong>: o PDF que vai para o cliente — com o nome da
                cafeteria, cliente, eventos, itens (sem preços) e o total.</Passo>
              <Passo num={2}><strong>“Gerar PDF do Resultado (uso interno)”</strong>: o PDF só seu, com custos e lucro.</Passo>
              <Passo num={3}>O navegador baixa o arquivo (vai para a pasta <strong>Downloads</strong> do computador).
                É só abrir, conferir e enviar por e-mail ou WhatsApp.</Passo>
            </ol>
          </div>
        </div>
      </Secao>

      <Secao
        icon={ShieldCheck}
        titulo="Onde ficam os dados?"
        intro="Tudo o que você salva (clientes, produtos, receitas, propostas) fica em um banco de dados no servidor, protegido por senha."
      >
        <ul className="space-y-2 text-sm text-gray-700 leading-relaxed">
          <li className="flex items-start gap-2"><ArrowRight size={15} className="text-amber-700 shrink-0 mt-0.5" />Você pode acessar de qualquer computador ou celular — é só entrar no site e fazer login.</li>
          <li className="flex items-start gap-2"><ArrowRight size={15} className="text-amber-700 shrink-0 mt-0.5" />Os PDFs gerados ficam no seu computador (pasta Downloads), como qualquer arquivo baixado.</li>
          <li className="flex items-start gap-2"><ArrowRight size={15} className="text-amber-700 shrink-0 mt-0.5" />Use o botão <strong>“Baixar backup (JSON)”</strong> em Configurações para guardar uma cópia dos dados.</li>
        </ul>
      </Secao>

      <Secao
        icon={Lightbulb}
        titulo="Dicas rápidas"
      >
        <ul className="space-y-2 text-sm text-gray-700 leading-relaxed">
          <li className="flex items-start gap-2"><ArrowRight size={15} className="text-amber-700 shrink-0 mt-0.5" /><strong>Atualize a página</strong> (tecla F5) se algo estiver estranho — os dados estão salvos no servidor.</li>
          <li className="flex items-start gap-2"><ArrowRight size={15} className="text-amber-700 shrink-0 mt-0.5" />O número da proposta (ex.: 020826-01-R00) é gerado sozinho ao gerar o PDF ou salvar.</li>
          <li className="flex items-start gap-2"><ArrowRight size={15} className="text-amber-700 shrink-0 mt-0.5" />As categorias são livres: você pode criar “Frutas”, “Integrais” etc. na aba Produtos.</li>
          <li className="flex items-start gap-2"><ArrowRight size={15} className="text-amber-700 shrink-0 mt-0.5" />Errou algo em um PDF? Gere de novo — o programa baixa um arquivo novo, e você apaga o antigo.</li>
          <li className="flex items-start gap-2"><ArrowRight size={15} className="text-amber-700 shrink-0 mt-0.5" />Esqueceu a senha? Peça para a equipe de TI (Cacir Soluções Tecnológicas) redefinir.</li>
        </ul>
      </Secao>
    </div>
  )
}
