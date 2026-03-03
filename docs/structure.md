# Estrutura do Projeto

Este documento descreve a organização completa de diretórios e arquivos do projeto Meraki Ansible.

## Visão Geral da Estrutura

```
meraki-ansible/
├── README.md                          # Documentação principal
├── meraki_provision.yml               # Playbook principal
├── cliente_abc.yml                    # Exemplo de configuração
│
├── docs/                              # Documentação detalhada
│   ├── index.md                       # Página inicial
│   ├── overview.md                    # Visão geral
│   ├── prerequisites.md               # Pré-requisitos
│   ├── installation.md                # Instalação
│   ├── configuration.md               # Configuração
│   ├── guidelines.md                  # Padrões e convenções
│   ├── structure.md                   # Este arquivo
│   ├── api-endpoints.md               # Endpoints da API
│   ├── system-modeling.md             # Modelagem do sistema
│   ├── authentication.md              # Autenticação e segurança
│   ├── development.md                 # Guia de desenvolvimento
│   ├── testing.md                     # Testes
│   ├── deploy.md                      # Deploy
│   ├── contributing.md                # Contribuição
│   └── release-notes.md               # Notas de versão
│
├── inventory/                         # Inventários Ansible
│   └── hosts.ini                      # Inventário padrão
│
├── roles/                             # Roles Ansible
│   └── meraki_provisioning/           # Role principal
│       ├── defaults/                  # Valores padrão
│       │   └── main.yml
│       └── tasks/                     # Tarefas
│           └── main.yml
│
└── vars/                              # Variáveis
    ├── meraki_config.yml              # Template de configuração
    └── vault.yml                      # Credenciais (criptografado)
```

## Arquivos Raiz

### README.md

**Propósito**: Documentação principal do projeto, visível na página inicial do repositório.

**Conteúdo**:
- Descrição do projeto
- Instruções rápidas de uso
- Exemplos de execução
- Informações de contato

### meraki_provision.yml

**Propósito**: Playbook principal que orquestra todo o provisionamento.

**Estrutura**:
```yaml
- name: Provisionar Infraestrutura Meraki
  hosts: localhost
  connection: local

  pre_tasks:
    # Validação de variáveis obrigatórias

  roles:
    - meraki_provisioning

  post_tasks:
    # Resumo da execução
```

**Responsabilidades**:
1. Validar variáveis obrigatórias (`meraki_api_key`, `meraki_config`)
2. Chamar a role `meraki_provisioning`
3. Exibir resumo ao final

### cliente_abc.yml

**Propósito**: Exemplo completo de arquivo de configuração para um cliente.

**Uso**: Serve como referência para criar novas configurações.

```bash
# Usar como base para novo cliente
cp cliente_abc.yml vars/cliente_novo.yml
```

## Diretório: inventory/

### hosts.ini

**Propósito**: Define os hosts onde o Ansible executará.

**Conteúdo**:
```ini
[local]
localhost ansible_connection=local
```

**Nota**: Como o projeto faz chamadas API, a execução é local (não há hosts remotos).

## Diretório: roles/

### meraki_provisioning/

Role principal que contém toda a lógica de automação.

#### defaults/main.yml

**Propósito**: Define valores padrão para variáveis da role.

**Conteúdo**:
```yaml
meraki_base_url: "https://api.meraki.com/api/v1"
meraki_claim_wait: 5
```

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `meraki_base_url` | URL base da API Meraki | https://api.meraki.com/api/v1 |
| `meraki_claim_wait` | Segundos de espera após claim | 5 |

#### tasks/main.yml

**Propósito**: Contém todas as tarefas de provisionamento.

**Seções**:

| Seção | Tags | Descrição |
|-------|------|-----------|
| Organização | `org`, `always` | Verificar/criar organização |
| Redes | `networks` | Criar redes |
| SSIDs | `networks`, `ssids` | Configurar SSIDs |
| Claim APs | `aps` | Reivindicar APs |
| Config APs | `aps`, `ap_config` | Configurar APs |
| RF Profiles | `rf` | Perfis de rádio |

**Fluxo de Execução**:

```
┌─────────────────────┐
│ 1. Organização      │ ← Verifica/cria org
├─────────────────────┤
│ 2. Redes            │ ← Cria redes na org
├─────────────────────┤
│ 3. SSIDs            │ ← Configura SSIDs nas redes
├─────────────────────┤
│ 4. Claim APs        │ ← Reivindica APs na org
├─────────────────────┤
│ 5. Adiciona APs     │ ← Adiciona APs às redes
├─────────────────────┤
│ 6. Configura APs    │ ← Nome, localização, tags
└─────────────────────┘
```

## Diretório: vars/

### meraki_config.yml

**Propósito**: Template de configuração com estrutura completa.

**Uso**: Copiar e personalizar para cada ambiente/cliente.

**Estrutura**:
```yaml
meraki_config:
  organization:
    name: "..."
    timezone: "..."
    notes: "..."

  networks:
    - name: "..."
      product_types: [...]
      ssids: [...]
      access_points: [...]
```

### vault.yml

**Propósito**: Armazenar credenciais de forma segura.

**Conteúdo** (antes de criptografar):
```yaml
vault_meraki_api_key: "sua_api_key"
```

**Segurança**:
```bash
# Criptografar
ansible-vault encrypt vars/vault.yml

# Visualizar (requer senha)
ansible-vault view vars/vault.yml

# Editar (requer senha)
ansible-vault edit vars/vault.yml
```

## Diretório: docs/

Documentação completa do projeto em formato Markdown.

| Arquivo | Descrição |
|---------|-----------|
| `index.md` | Página inicial e navegação |
| `overview.md` | Visão geral do projeto |
| `prerequisites.md` | Requisitos necessários |
| `installation.md` | Guia de instalação |
| `configuration.md` | Opções de configuração |
| `guidelines.md` | Padrões e convenções |
| `structure.md` | Estrutura do projeto (este arquivo) |
| `api-endpoints.md` | Referência da API Meraki |
| `system-modeling.md` | Diagramas e modelagem |
| `authentication.md` | Segurança e autenticação |
| `development.md` | Guia para desenvolvedores |
| `testing.md` | Como testar |
| `deploy.md` | Implantação |
| `contributing.md` | Como contribuir |
| `release-notes.md` | Histórico de versões |

## Mapa de Dependências

```
meraki_provision.yml
       │
       ├──► pre_tasks (validação)
       │
       ├──► roles/meraki_provisioning/
       │         │
       │         ├──► defaults/main.yml
       │         │         └──► meraki_base_url
       │         │         └──► meraki_claim_wait
       │         │
       │         └──► tasks/main.yml
       │                   └──► Usa variáveis de:
       │                         - vars/meraki_config.yml
       │                         - vars/vault.yml
       │
       └──► post_tasks (resumo)
```

## Fluxo de Variáveis

```
┌─────────────────────────────────────────────────────────┐
│                    PRIORIDADE                           │
├─────────────────────────────────────────────────────────┤
│  ALTA   │  Linha de comando (-e var=value)             │
├─────────┼───────────────────────────────────────────────┤
│         │  vars/vault.yml (credenciais)                │
├─────────┼───────────────────────────────────────────────┤
│         │  vars/meraki_config.yml (configuração)       │
├─────────┼───────────────────────────────────────────────┤
│  BAIXA  │  roles/*/defaults/main.yml (padrões)         │
└─────────┴───────────────────────────────────────────────┘
```

## Arquivos Gerados em Runtime

Durante a execução, o Ansible pode criar:

| Arquivo/Diretório | Descrição |
|-------------------|-----------|
| `*.retry` | Arquivo de retry em caso de falha |
| `.ansible/` | Cache do Ansible (se configurado) |

**Recomendação**: Adicionar ao `.gitignore`:
```gitignore
*.retry
.ansible/
```

## Extensibilidade

### Adicionando Nova Role

```bash
mkdir -p roles/nova_role/{tasks,defaults,templates,handlers}
touch roles/nova_role/tasks/main.yml
touch roles/nova_role/defaults/main.yml
```

### Adicionando Novo Playbook

```bash
touch novo_playbook.yml
```

```yaml
# novo_playbook.yml
- name: Novo Playbook
  hosts: localhost
  connection: local
  roles:
    - meraki_provisioning
    - nova_role
```

## Próximos Passos

- Consulte [API Endpoints](api-endpoints.md) para entender as chamadas de API
- Veja [Modelagem do Sistema](system-modeling.md) para diagramas detalhados
