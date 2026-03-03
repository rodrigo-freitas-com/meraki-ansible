# Modelagem do Sistema

Este documento apresenta os diagramas de arquitetura, fluxos e modelos de dados do projeto Meraki Ansible.

## Modelos de Dados

### Diagrama Entidade-Relacionamento (ERD)

```mermaid
%%{init: {'theme': 'dark'}}%%
erDiagram
    ORGANIZATION ||--o{ NETWORK : contains
    NETWORK ||--o{ SSID : has
    NETWORK ||--o{ ACCESS_POINT : has
    ACCESS_POINT ||--o| RF_PROFILE : uses

    ORGANIZATION {
        string id PK
        string name
        string timezone
        string notes
        boolean api_enabled
    }

    NETWORK {
        string id PK
        string organization_id FK
        string name
        array product_types
        string timezone
        array tags
        string notes
    }

    SSID {
        int number PK
        string network_id FK
        string name
        boolean enabled
        string auth_mode
        string encryption_mode
        string wpa_encryption_mode
        string psk
        string ip_assignment_mode
        int default_vlan_id
    }

    ACCESS_POINT {
        string serial PK
        string network_id FK
        string name
        string mac
        string model
        array tags
        float lat
        float lng
        string address
        string notes
        string rf_profile_id FK
    }

    RF_PROFILE {
        string id PK
        string network_id FK
        string name
        json band_settings
    }
```

## Arquitetura do Sistema

### Visão Geral da Arquitetura

```mermaid
%%{init: {'theme': 'dark'}}%%
graph TB
    subgraph "Ambiente Local"
        A[Operador] --> B[Ansible Controller]
        B --> C[Playbook<br/>meraki_provision.yml]
        C --> D[Role<br/>meraki_provisioning]

        subgraph "Configuração"
            E[vars/meraki_config.yml]
            F[vars/vault.yml]
        end

        D --> E
        D --> F
    end

    subgraph "Meraki Cloud"
        G[Meraki Dashboard API<br/>api.meraki.com]

        subgraph "Recursos Meraki"
            H[Organization]
            I[Networks]
            J[SSIDs]
            K[Access Points]
        end

        G --> H
        H --> I
        I --> J
        I --> K
    end

    D -->|HTTPS/REST| G
```

### Componentes do Sistema

```mermaid
%%{init: {'theme': 'dark'}}%%
graph LR
    subgraph "Camada de Apresentação"
        A[CLI - Ansible Playbook]
    end

    subgraph "Camada de Orquestração"
        B[Playbook Principal]
        C[Pre-tasks - Validação]
        D[Post-tasks - Resumo]
    end

    subgraph "Camada de Lógica"
        E[Role: meraki_provisioning]
        F[Tasks: Organização]
        G[Tasks: Redes]
        H[Tasks: SSIDs]
        I[Tasks: APs]
    end

    subgraph "Camada de Dados"
        J[meraki_config.yml]
        K[vault.yml]
        L[defaults/main.yml]
    end

    subgraph "Camada Externa"
        M[Meraki API v1]
    end

    A --> B
    B --> C
    B --> E
    B --> D
    E --> F
    E --> G
    E --> H
    E --> I
    F --> J
    F --> K
    F --> L
    F --> M
    G --> M
    H --> M
    I --> M
```

## Fluxo de Autenticação

### Fluxo de Validação da API Key

```mermaid
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
    participant O as Operador
    participant A as Ansible
    participant V as Vault
    participant M as Meraki API

    O->>A: Executa playbook

    alt API Key via Environment
        O->>A: $MERAKI_API_KEY
    else API Key via Vault
        A->>V: Solicita vault_meraki_api_key
        V-->>A: API Key (descriptografada)
    end

    A->>A: Valida se API Key existe

    alt API Key não definida
        A-->>O: Erro: API Key obrigatória
    else API Key definida
        A->>M: GET /organizations

        alt API Key válida
            M-->>A: 200 OK + Lista de orgs
            A-->>O: Continua execução
        else API Key inválida
            M-->>A: 401 Unauthorized
            A-->>O: Erro: API Key inválida
        end
    end
```

### Processo de Descriptografia do Vault

```mermaid
%%{init: {'theme': 'dark'}}%%
flowchart TD
    A[Início] --> B{Vault está<br/>criptografado?}

    B -->|Sim| C{Senha fornecida?}
    B -->|Não| D[Carrega variáveis<br/>diretamente]

    C -->|--ask-vault-pass| E[Solicita senha<br/>interativamente]
    C -->|--vault-password-file| F[Lê senha do<br/>arquivo]
    C -->|Não| G[Erro: Senha<br/>necessária]

    E --> H[Descriptografa vault]
    F --> H

    H --> I{Senha correta?}

    I -->|Sim| J[Carrega variáveis]
    I -->|Não| K[Erro: Senha<br/>incorreta]

    D --> J
    J --> L[Continua execução]

    G --> M[Fim com erro]
    K --> M
    L --> N[Fim com sucesso]
```

## Fluxo de Provisionamento

### Fluxo Principal de Execução

```mermaid
%%{init: {'theme': 'dark'}}%%
flowchart TD
    A[Início] --> B[Carregar Variáveis]
    B --> C{Variáveis<br/>válidas?}

    C -->|Não| D[Erro: Variáveis<br/>obrigatórias faltando]
    C -->|Sim| E[Verificar Organização]

    E --> F{Org existe?}
    F -->|Não| G[Criar Organização]
    F -->|Sim| H[Usar Org existente]

    G --> I[Obter Org ID]
    H --> I

    I --> J[Verificar Redes]
    J --> K{Todas redes<br/>existem?}

    K -->|Não| L[Criar Redes faltantes]
    K -->|Sim| M[Usar Redes existentes]

    L --> N[Consolidar Network IDs]
    M --> N

    N --> O[Configurar SSIDs]
    O --> P[Claim APs na Org]
    P --> Q[Aguardar 5 segundos]
    Q --> R[Adicionar APs às Redes]
    R --> S[Configurar APs]
    S --> T[Exibir Resumo]
    T --> U[Fim]

    D --> V[Fim com erro]
```

### Fluxo Detalhado de Criação de Rede

```mermaid
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
    participant A as Ansible
    participant M as Meraki API
    participant DB as Meraki Dashboard

    A->>M: GET /organizations/{org_id}/networks
    M-->>A: Lista de redes existentes

    A->>A: Mapear redes por nome

    loop Para cada rede na config
        A->>A: Verificar se rede existe

        alt Rede não existe
            A->>M: POST /organizations/{org_id}/networks
            Note over A,M: name, productTypes, timezone, tags, notes
            M->>DB: Criar rede
            DB-->>M: Rede criada
            M-->>A: 201 + Network ID
        else Rede existe
            A->>A: Usar Network ID existente
        end
    end

    A->>A: Consolidar todos Network IDs
```

## Fluxo de Configuração de SSIDs

### Processo de Configuração de SSID

```mermaid
%%{init: {'theme': 'dark'}}%%
flowchart TD
    A[Início SSID Config] --> B[Para cada Rede]
    B --> C{Rede tem<br/>wireless?}

    C -->|Não| D[Pular rede]
    C -->|Sim| E[Para cada SSID]

    E --> F[Montar payload]

    F --> G{Auth Mode?}
    G -->|open| H[Sem senha]
    G -->|psk| I[Incluir PSK]

    H --> J[PUT /networks/{id}/wireless/ssids/{n}]
    I --> J

    J --> K{Sucesso?}
    K -->|Sim| L[SSID configurado]
    K -->|Não| M[Registrar erro]

    L --> N{Mais SSIDs?}
    M --> N

    N -->|Sim| E
    N -->|Não| O{Mais redes?}

    D --> O
    O -->|Sim| B
    O -->|Não| P[Fim]
```

## Fluxo de Provisionamento de Access Points

### Fluxo de Claim e Configuração de APs

```mermaid
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
    participant A as Ansible
    participant M as Meraki API
    participant I as Inventory
    participant N as Network

    Note over A: Coletar todos seriais
    A->>A: Extrair seriais de todas as redes

    A->>M: POST /organizations/{org_id}/inventory/claim
    Note over A,M: serials: [lista de seriais]
    M->>I: Claim dispositivos
    I-->>M: Dispositivos claimed
    M-->>A: 200 OK

    A->>A: Aguardar 5 segundos

    loop Para cada rede
        A->>A: Filtrar APs da rede
        A->>M: POST /networks/{network_id}/devices/claim
        M->>N: Adicionar dispositivos
        N-->>M: Dispositivos adicionados
        M-->>A: 200 OK
    end

    loop Para cada AP
        A->>M: PUT /devices/{serial}
        Note over A,M: name, tags, lat, lng, address, notes
        M-->>A: 200 OK + Config atualizada

        opt RF Profile definido
            A->>M: PUT /devices/{serial}/wireless/radio/settings
            M-->>A: 200 OK
        end
    end
```

## Fluxo de Segurança

### Ciclo de Vida de Credenciais

```mermaid
%%{init: {'theme': 'dark'}}%%
flowchart TD
    subgraph "Criação"
        A[Gerar API Key no<br/>Meraki Dashboard] --> B[Copiar API Key]
        B --> C[Criar vault.yml]
        C --> D[ansible-vault encrypt]
    end

    subgraph "Armazenamento"
        D --> E[vault.yml criptografado]
        E --> F[Commit no repositório<br/>de forma segura]
    end

    subgraph "Uso"
        F --> G[Ansible carrega vault]
        G --> H{Método de senha}
        H -->|--ask-vault-pass| I[Input interativo]
        H -->|--vault-password-file| J[Arquivo de senha]
        I --> K[Descriptografar]
        J --> K
        K --> L[API Key em memória]
        L --> M[Usar em requisições]
    end

    subgraph "Rotação"
        N[Gerar nova API Key] --> O[Atualizar vault.yml]
        O --> P[Re-criptografar]
        P --> Q[Revogar key antiga]
    end

    M -.-> N
```

### Validação de Entrada

```mermaid
%%{init: {'theme': 'dark'}}%%
flowchart TD
    A[Receber Input] --> B{meraki_api_key<br/>definida?}

    B -->|Não| C[ERRO: API Key obrigatória]
    B -->|Sim| D{meraki_config<br/>definida?}

    D -->|Não| E[ERRO: Config obrigatória]
    D -->|Sim| F{organization.name<br/>definido?}

    F -->|Não| G[ERRO: Nome da org obrigatório]
    F -->|Sim| H{networks<br/>é lista válida?}

    H -->|Não| I[ERRO: Networks inválido]
    H -->|Sim| J[Validação OK]

    J --> K[Continuar execução]

    C --> L[Fim com erro]
    E --> L
    G --> L
    I --> L
```

## Diagrama de Estados

### Estados do Provisionamento

```mermaid
%%{init: {'theme': 'dark'}}%%
stateDiagram-v2
    [*] --> Iniciando

    Iniciando --> Validando: Carregar config
    Validando --> Erro: Validação falhou
    Validando --> ProvisionandoOrg: Validação OK

    ProvisionandoOrg --> ProvisionandoRedes: Org OK
    ProvisionandoOrg --> Erro: Falha na org

    ProvisionandoRedes --> ConfigurandoSSIDs: Redes OK
    ProvisionandoRedes --> Erro: Falha nas redes

    ConfigurandoSSIDs --> ClaimandoAPs: SSIDs OK
    ConfigurandoSSIDs --> Erro: Falha nos SSIDs

    ClaimandoAPs --> ConfigurandoAPs: Claim OK
    ClaimandoAPs --> Erro: Falha no claim

    ConfigurandoAPs --> Concluido: Config OK
    ConfigurandoAPs --> Erro: Falha na config

    Concluido --> [*]
    Erro --> [*]
```

## Diagrama de Componentes

### Interação entre Componentes

```mermaid
%%{init: {'theme': 'dark'}}%%
graph TB
    subgraph "Interface"
        CLI[Ansible CLI]
    end

    subgraph "Orquestração"
        PB[meraki_provision.yml]
        PRE[Pre-tasks]
        POST[Post-tasks]
    end

    subgraph "Lógica de Negócio"
        ROLE[Role: meraki_provisioning]
        TASK_ORG[Tasks: Organization]
        TASK_NET[Tasks: Networks]
        TASK_SSID[Tasks: SSIDs]
        TASK_AP[Tasks: Access Points]
    end

    subgraph "Dados"
        CONFIG[meraki_config.yml]
        VAULT[vault.yml]
        DEFAULTS[defaults/main.yml]
    end

    subgraph "Externo"
        API[Meraki Dashboard API]
    end

    CLI --> PB
    PB --> PRE
    PB --> ROLE
    PB --> POST

    ROLE --> TASK_ORG
    ROLE --> TASK_NET
    ROLE --> TASK_SSID
    ROLE --> TASK_AP

    TASK_ORG --> CONFIG
    TASK_ORG --> VAULT
    TASK_ORG --> DEFAULTS
    TASK_ORG --> API

    TASK_NET --> API
    TASK_SSID --> API
    TASK_AP --> API
```

## Próximos Passos

- Consulte [Autenticação e Segurança](authentication.md) para detalhes de segurança
- Veja [Desenvolvimento](development.md) para contribuir com o projeto
