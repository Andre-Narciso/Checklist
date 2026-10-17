import type { ProjectState, Step, Task } from '../types';

interface RawStep {
  name: string;
  description: string;
  tasks: string[];
}

const RAW_STEPS: RawStep[] = [
  {
    name: 'Planejamento e requisitos',
    description: 'Escopo do MVP, público-alvo, módulos iniciais e critérios de conclusão.',
    tasks: [
      'Definir o escopo do MVP',
      'Definir público-alvo e perfis de usuário',
      'Definir módulos iniciais e prioridades',
      'Documentar requisitos funcionais',
      'Documentar requisitos não funcionais',
      'Definir critérios de conclusão de cada módulo',
    ],
  },
  {
    name: 'Ambiente de desenvolvimento',
    description: 'Preparação do ambiente local, ferramentas e versionamento.',
    tasks: [
      'Verificar Python, Git e Docker',
      'Instalar e configurar ferramentas',
      'Criar repositório Git',
      'Definir estrutura de diretórios',
      'Criar ambiente virtual Python',
      'Configurar dependências iniciais',
      'Configurar variáveis de ambiente',
      'Validar execução local',
    ],
  },
  {
    name: 'Arquitetura e padrões',
    description: 'Arquitetura de monólito modular, organização Django e padrões técnicos.',
    tasks: [
      'Definir arquitetura de monólito modular',
      'Definir organização dos aplicativos Django',
      'Definir padrões de código e nomenclatura',
      'Definir estratégia de configurações por ambiente',
      'Definir padrão de logs e tratamento de erros',
      'Documentar arquitetura inicial',
    ],
  },
  {
    name: 'Identidade visual e UX/UI',
    description: 'Design system, identidade visual e experiência do usuário.',
    tasks: [
      'Definir paleta de cores e tipografia',
      'Definir logotipo e identidade visual',
      'Escolher biblioteca de componentes',
      'Criar design system',
      'Criar layout principal responsivo',
      'Criar menu lateral e cabeçalho',
      'Criar componentes reutilizáveis',
      'Definir estados de carregamento, erro e vazio',
      'Validar acessibilidade e usabilidade',
    ],
  },
  {
    name: 'Banco de dados e infraestrutura local',
    description: 'PostgreSQL, Docker Compose e persistência do ambiente local.',
    tasks: [
      'Configurar PostgreSQL',
      'Configurar conexão Django/PostgreSQL',
      'Definir convenções de modelagem',
      'Criar estratégia de migrações',
      'Configurar Docker Compose',
      'Implementar health checks',
      'Testar persistência e reinicialização',
      'Documentar inicialização do ambiente',
    ],
  },
  {
    name: 'Autenticação e usuários',
    description: 'Usuários, login, sessões, perfis e permissões.',
    tasks: [
      'Implementar modelo de usuário',
      'Implementar login e logout',
      'Implementar recuperação de senha',
      'Implementar gestão de sessões',
      'Definir perfis e permissões',
      'Validar formulários e mensagens de erro',
      'Criar testes de autenticação e autorização',
    ],
  },
  {
    name: 'Multiempresa e isolamento',
    description: 'Organizações, papéis e isolamento de dados por escritório.',
    tasks: [
      'Criar módulo de organizações/escritórios',
      'Relacionar usuários às organizações',
      'Definir papéis dentro de cada organização',
      'Implementar isolamento dos dados por organização',
      'Proteger consultas e operações',
      'Testar tentativas de acesso cruzado',
      'Avaliar PostgreSQL Row-Level Security',
      'Documentar regras de isolamento',
    ],
  },
  {
    name: 'Auditoria e segurança base',
    description: 'Auditoria, proteção de segredos e políticas de segurança.',
    tasks: [
      'Definir eventos que serão auditados',
      'Registrar operações sensíveis',
      'Proteger segredos e credenciais',
      'Configurar proteção CSRF e cookies',
      'Definir política de permissões',
      'Validar upload de arquivos com segurança',
      'Definir política de retenção e privacidade',
      'Criar testes de segurança essenciais',
    ],
  },
  {
    name: 'Dashboard e navegação',
    description: 'Dashboard inicial, navegação entre módulos e indicadores.',
    tasks: [
      'Criar dashboard inicial',
      'Criar navegação entre módulos',
      'Criar indicadores básicos',
      'Criar notificações visuais',
      'Criar estados sem dados',
      'Validar responsividade',
      'Validar permissões por tela',
    ],
  },
  {
    name: 'Módulo de clientes',
    description: 'Cadastro, consulta e gestão de clientes.',
    tasks: [
      'Criar modelos de clientes',
      'Implementar cadastro e edição',
      'Implementar consulta e listagem',
      'Implementar pesquisa e filtros',
      'Implementar validações',
      'Associar clientes à organização correta',
      'Criar testes funcionais e de autorização',
    ],
  },
  {
    name: 'Módulo de processos',
    description: 'Cadastro, acompanhamento e histórico de processos.',
    tasks: [
      'Criar modelos de processos',
      'Relacionar processos e clientes',
      'Implementar cadastro e edição',
      'Implementar listagem e filtros',
      'Criar página de detalhes do processo',
      'Implementar status e histórico',
      'Criar testes funcionais e de isolamento',
    ],
  },
  {
    name: 'JurisArquivo: documentos',
    description: 'Armazenamento privado, upload e gestão de documentos.',
    tasks: [
      'Definir arquitetura de armazenamento privado',
      'Criar metadados e categorias de documentos',
      'Implementar upload e validação de arquivos',
      'Implementar download autorizado',
      'Associar documentos a clientes e processos',
      'Implementar pesquisa e filtros',
      'Implementar versões, se necessárias ao MVP',
      'Registrar operações de documentos',
      'Criar testes de acesso e integridade',
    ],
  },
  {
    name: 'Módulo de tarefas e prazos',
    description: 'Tarefas, prazos, responsáveis e notificações.',
    tasks: [
      'Definir modelos de tarefas e prazos',
      'Relacionar tarefas a processos e responsáveis',
      'Implementar criação e atribuição',
      'Implementar estados e prioridades',
      'Criar visualização de prazos próximos',
      'Implementar notificações iniciais',
      'Criar testes funcionais e de autorização',
    ],
  },
  {
    name: 'Testes e qualidade',
    description: 'Testes automatizados, qualidade e desempenho das consultas.',
    tasks: [
      'Configurar framework de testes',
      'Criar testes unitários',
      'Criar testes de integração',
      'Criar testes de interface essenciais',
      'Testar isolamento entre organizações',
      'Testar validações e permissões',
      'Verificar desempenho das consultas',
      'Configurar análise estática e formatação',
    ],
  },
  {
    name: 'CI/CD e versionamento',
    description: 'Integração contínua, branches, releases e dependências.',
    tasks: [
      'Definir estratégia de branches',
      'Padronizar commits',
      'Configurar pipeline de integração contínua',
      'Executar testes automaticamente',
      'Validar migrações no pipeline',
      'Verificar dependências vulneráveis',
      'Definir processo de release',
    ],
  },
  {
    name: 'Implantação e operação',
    description: 'Hospedagem, produção, HTTPS, backups e monitoramento.',
    tasks: [
      'Escolher ambiente de hospedagem',
      'Preparar configuração de produção',
      'Configurar HTTPS e domínio',
      'Configurar servidor da aplicação',
      'Configurar banco e armazenamento',
      'Desativar DEBUG e validar hosts',
      'Configurar logs e monitoramento',
      'Implementar backups automáticos',
      'Testar restauração de backups',
      'Documentar atualização e rollback',
    ],
  },
  {
    name: 'LGPD e preparação comercial',
    description: 'LGPD, termos, políticas e preparação para comercialização.',
    tasks: [
      'Mapear dados pessoais tratados',
      'Documentar finalidade e retenção dos dados',
      'Definir procedimentos de atendimento aos titulares',
      'Revisar contratos e responsabilidades de tratamento',
      'Definir termos de uso e política de privacidade',
      'Definir planos e limites comerciais',
      'Definir onboarding de escritórios',
      'Validar requisitos legais aplicáveis',
    ],
  },
  {
    name: 'Testes finais e lançamento do MVP',
    description: 'Regressão, segurança, piloto e lançamento do MVP.',
    tasks: [
      'Executar testes de regressão',
      'Executar revisão de segurança',
      'Validar fluxos completos de usuário',
      'Corrigir problemas críticos',
      'Validar experiência em dispositivos diferentes',
      'Realizar implantação piloto',
      'Documentar limitações conhecidas',
      'Aprovar checklist de lançamento',
    ],
  },
];

export const INITIAL_VERSION = 1;

export function createInitialState(): ProjectState {
  const now = new Date().toISOString();

  const steps: Step[] = RAW_STEPS.map((raw, index) => {
    const number = index + 1;
    const tasks: Task[] = raw.tasks.map((title, taskIndex) => ({
      id: `s${number}-t${taskIndex + 1}`,
      title,
      status: 'nao_iniciada',
      priority: 'media',
      notes: '',
      dueDate: null,
      completedAt: null,
      createdAt: now,
      custom: false,
    }));

    return {
      id: `step-${number}`,
      number,
      name: raw.name,
      description: raw.description,
      notes: '',
      startDate: null,
      dueDate: null,
      priority: 'media',
      tasks,
    };
  });

  const totalTasks = steps.reduce((acc, s) => acc + s.tasks.length, 0);

  return {
    version: INITIAL_VERSION,
    steps,
    notes: [],
    history: [
      {
        id: `h-${Date.now()}`,
        at: now,
        message: `Projeto inicializado com ${steps.length} etapas e ${totalTasks} tarefas.`,
      },
    ],
    theme: 'light',
    updatedAt: now,
  };
}