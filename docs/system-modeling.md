# Modelagem do Sistema

Este documento apresenta os diagramas de arquitetura, fluxos e modelos de dados do projeto Meraki Ansible.

## Modelos de Dados

### Diagrama Entidade-Relacionamento (ERD)

```mermaid
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
        string product_types
        string timezone
        string tags
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
        string tags
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
        string band_settings
    }
```

## Arquitetura do Sistema

### Visao Geral da Arquitetura

```mermaid
graph TB
    subgraph Local[Ambiente Local]
        A[Operador] --> B[Ansible Controller]
        B --> C[Playbook]
        C --> D[Role]

        subgraph Config[Configuracao]
            E[meraki_config.yml]
            F[vault.yml]
        end

        D --> E
        D --> F
    end

    subgraph Cloud[Meraki Cloud]
        G[Meraki Dashboard API]

        subgraph Resources[Recursos Meraki]
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
graph LR
    subgraph Presentation[Camada de Apresentacao]
        A[CLI Ansible Playbook]
    end

    subgraph Orchestration[Camada de Orquestracao]
        B[Playbook Principal]
        C[Pre-tasks]
        D[Post-tasks]
    end

    subgraph Logic[Camada de Logica]
        E[Role meraki_provisioning]
        F[Tasks Organizacao]
        G[Tasks Redes]
        H[Tasks SSIDs]
        I[Tasks APs]
    end

    subgraph Data[Camada de Dados]
        J[meraki_config.yml]
        K[vault.yml]
        L[defaults/main.yml]
    end

    subgraph External[Camada Externa]
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

## Fluxo de Autenticacao

### Fluxo de Validacao da API Key

```mermaid
sequenceDiagram
    participant O as Operador
    participant A as Ansible
    participant V as Vault
    participant M as Meraki API

    O->>A: Executa playbook

    alt API Key via Environment
        O->>A: MERAKI_API_KEY
    else API Key via Vault
        A->>V: Solicita vault_meraki_api_key
        V-->>A: API Key descriptografada
    end

    A->>A: Valida se API Key existe

    alt API Key nao definida
        A-->>O: Erro API Key obrigatoria
    else API Key definida
        A->>M: GET /organizations

        alt API Key valida
            M-->>A: 200 OK Lista de orgs
            A-->>O: Continua execucao
        else API Key invalida
            M-->>A: 401 Unauthorized
            A-->>O: Erro API Key invalida
        end
    end
```

### Processo de Descriptografia do Vault

```mermaid
flowchart TD
    A[Inicio] --> B{Vault esta criptografado}

    B -->|Sim| C{Senha fornecida}
    B -->|Nao| D[Carrega variaveis diretamente]

    C -->|ask-vault-pass| E[Solicita senha interativamente]
    C -->|vault-password-file| F[Le senha do arquivo]
    C -->|Nao| G[Erro Senha necessaria]

    E --> H[Descriptografa vault]
    F --> H

    H --> I{Senha correta}

    I -->|Sim| J[Carrega variaveis]
    I -->|Nao| K[Erro Senha incorreta]

    D --> J
    J --> L[Continua execucao]

    G --> M[Fim com erro]
    K --> M
    L --> N[Fim com sucesso]
```

## Fluxo de Provisionamento

### Fluxo Principal de Execucao

```mermaid
flowchart TD
    A[Inicio] --> B[Carregar Variaveis]
    B --> C{Variaveis validas}

    C -->|Nao| D[Erro Variaveis obrigatorias faltando]
    C -->|Sim| E[Verificar Organizacao]

    E --> F{Org existe}
    F -->|Nao| G[Criar Organizacao]
    F -->|Sim| H[Usar Org existente]

    G --> I[Obter Org ID]
    H --> I

    I --> J[Verificar Redes]
    J --> K{Todas redes existem}

    K -->|Nao| L[Criar Redes faltantes]
    K -->|Sim| M[Usar Redes existentes]

    L --> N[Consolidar Network IDs]
    M --> N

    N --> O[Configurar SSIDs]
    O --> P[Claim APs na Org]
    P --> Q[Aguardar 5 segundos]
    Q --> R[Adicionar APs as Redes]
    R --> S[Configurar APs]
    S --> T[Exibir Resumo]
    T --> U[Fim]

    D --> V[Fim com erro]
```

### Fluxo Detalhado de Criacao de Rede

```mermaid
sequenceDiagram
    participant A as Ansible
    participant M as Meraki API
    participant DB as Meraki Dashboard

    A->>M: GET /organizations/org_id/networks
    M-->>A: Lista de redes existentes

    A->>A: Mapear redes por nome

    loop Para cada rede na config
        A->>A: Verificar se rede existe

        alt Rede nao existe
            A->>M: POST /organizations/org_id/networks
            Note over A,M: name productTypes timezone tags notes
            M->>DB: Criar rede
            DB-->>M: Rede criada
            M-->>A: 201 Network ID
        else Rede existe
            A->>A: Usar Network ID existente
        end
    end

    A->>A: Consolidar todos Network IDs
```

## Fluxo de Configuracao de SSIDs

### Processo de Configuracao de SSID

```mermaid
flowchart TD
    A[Inicio SSID Config] --> B[Para cada Rede]
    B --> C{Rede tem wireless}

    C -->|Nao| D[Pular rede]
    C -->|Sim| E[Para cada SSID]

    E --> F[Montar payload]

    F --> G{Auth Mode}
    G -->|open| H[Sem senha]
    G -->|psk| I[Incluir PSK]

    H --> J[PUT /networks/ID/wireless/ssids/N]
    I --> J

    J --> K{Sucesso}
    K -->|Sim| L[SSID configurado]
    K -->|Nao| M[Registrar erro]

    L --> N{Mais SSIDs}
    M --> N

    N -->|Sim| E
    N -->|Nao| O{Mais redes}

    D --> O
    O -->|Sim| B
    O -->|Nao| P[Fim]
```

## Fluxo de Provisionamento de Access Points

### Fluxo de Claim e Configuracao de APs

```mermaid
sequenceDiagram
    participant A as Ansible
    participant M as Meraki API
    participant I as Inventory
    participant N as Network

    Note over A: Coletar todos seriais
    A->>A: Extrair seriais de todas as redes

    A->>M: POST /organizations/org_id/inventory/claim
    Note over A,M: serials lista de seriais
    M->>I: Claim dispositivos
    I-->>M: Dispositivos claimed
    M-->>A: 200 OK

    A->>A: Aguardar 5 segundos

    loop Para cada rede
        A->>A: Filtrar APs da rede
        A->>M: POST /networks/network_id/devices/claim
        M->>N: Adicionar dispositivos
        N-->>M: Dispositivos adicionados
        M-->>A: 200 OK
    end

    loop Para cada AP
        A->>M: PUT /devices/serial
        Note over A,M: name tags lat lng address notes
        M-->>A: 200 OK Config atualizada

        opt RF Profile definido
            A->>M: PUT /devices/serial/wireless/radio/settings
            M-->>A: 200 OK
        end
    end
```

## Fluxo de Seguranca

### Ciclo de Vida de Credenciais

```mermaid
flowchart TD
    subgraph Criacao[Criacao]
        A[Gerar API Key no Meraki Dashboard] --> B[Copiar API Key]
        B --> C[Criar vault.yml]
        C --> D[ansible-vault encrypt]
    end

    subgraph Armazenamento[Armazenamento]
        D --> E[vault.yml criptografado]
        E --> F[Commit no repositorio de forma segura]
    end

    subgraph Uso[Uso]
        F --> G[Ansible carrega vault]
        G --> H{Metodo de senha}
        H -->|ask-vault-pass| I[Input interativo]
        H -->|vault-password-file| J[Arquivo de senha]
        I --> K[Descriptografar]
        J --> K
        K --> L[API Key em memoria]
        L --> M[Usar em requisicoes]
    end

    subgraph Rotacao[Rotacao]
        N[Gerar nova API Key] --> O[Atualizar vault.yml]
        O --> P[Re-criptografar]
        P --> Q[Revogar key antiga]
    end

    M -.-> N
```

### Validacao de Entrada

```mermaid
flowchart TD
    A[Receber Input] --> B{meraki_api_key definida}

    B -->|Nao| C[ERRO API Key obrigatoria]
    B -->|Sim| D{meraki_config definida}

    D -->|Nao| E[ERRO Config obrigatoria]
    D -->|Sim| F{organization.name definido}

    F -->|Nao| G[ERRO Nome da org obrigatorio]
    F -->|Sim| H{networks e lista valida}

    H -->|Nao| I[ERRO Networks invalido]
    H -->|Sim| J[Validacao OK]

    J --> K[Continuar execucao]

    C --> L[Fim com erro]
    E --> L
    G --> L
    I --> L
```

## Diagrama de Estados

### Estados do Provisionamento

```mermaid
stateDiagram-v2
    [*] --> Iniciando

    Iniciando --> Validando: Carregar config
    Validando --> Erro: Validacao falhou
    Validando --> ProvisionandoOrg: Validacao OK

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

### Interacao entre Componentes

```mermaid
graph TB
    subgraph Interface[Interface]
        CLI[Ansible CLI]
    end

    subgraph Orquestracao[Orquestracao]
        PB[meraki_provision.yml]
        PRE[Pre-tasks]
        POST[Post-tasks]
    end

    subgraph Logica[Logica de Negocio]
        ROLE[Role meraki_provisioning]
        TASK_ORG[Tasks Organization]
        TASK_NET[Tasks Networks]
        TASK_SSID[Tasks SSIDs]
        TASK_AP[Tasks Access Points]
    end

    subgraph Dados[Dados]
        CONFIG[meraki_config.yml]
        VAULT[vault.yml]
        DEFAULTS[defaults/main.yml]
    end

    subgraph Externo[Externo]
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

## Proximos Passos

- Consulte [Autenticacao e Seguranca](authentication.md) para detalhes de seguranca
- Veja [Desenvolvimento](development.md) para contribuir com o projeto
