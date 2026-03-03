# Modelagem do Sistema

Este documento apresenta os diagramas de arquitetura, fluxos e modelos de dados do projeto Meraki Ansible.

---

## Modelos de Dados

### Relacionamentos entre Entidades

```
ORGANIZATION  1──────N  NETWORK
NETWORK       1──────N  SSID
NETWORK       1──────N  ACCESS_POINT
ACCESS_POINT  N──────1  RF_PROFILE (opcional)
```

### ORGANIZATION

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | string | Identificador unico (PK) |
| name | string | Nome da organizacao |
| timezone | string | Fuso horario |
| notes | string | Observacoes |
| api_enabled | boolean | API habilitada |

### NETWORK

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | string | Identificador unico (PK) |
| organization_id | string | ID da organizacao (FK) |
| name | string | Nome da rede |
| product_types | string | Tipos de produto |
| timezone | string | Fuso horario |
| tags | string | Tags de classificacao |
| notes | string | Observacoes |

### SSID

| Campo | Tipo | Descricao |
|-------|------|-----------|
| number | int | Numero do SSID 0-14 (PK) |
| network_id | string | ID da rede (FK) |
| name | string | Nome do SSID |
| enabled | boolean | SSID ativo |
| auth_mode | string | Modo de autenticacao |
| encryption_mode | string | Modo de criptografia |
| wpa_encryption_mode | string | Versao WPA |
| psk | string | Senha pre-compartilhada |
| ip_assignment_mode | string | Modo de atribuicao IP |
| default_vlan_id | int | VLAN padrao |

### ACCESS_POINT

| Campo | Tipo | Descricao |
|-------|------|-----------|
| serial | string | Numero de serie (PK) |
| network_id | string | ID da rede (FK) |
| name | string | Nome do AP |
| mac | string | Endereco MAC |
| model | string | Modelo do AP |
| tags | string | Tags de classificacao |
| lat | float | Latitude |
| lng | float | Longitude |
| address | string | Endereco fisico |
| notes | string | Observacoes |
| rf_profile_id | string | ID do perfil RF (FK) |

### RF_PROFILE

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | string | Identificador unico (PK) |
| network_id | string | ID da rede (FK) |
| name | string | Nome do perfil |
| band_settings | string | Configuracoes de banda |

---

## Arquitetura do Sistema

### Visao Geral

```mermaid
graph TB
    subgraph Local
        A[Operador]
        B[Ansible Controller]
        C[Playbook]
        D[Role]
        E[meraki_config.yml]
        F[vault.yml]
    end

    subgraph Cloud
        G[Meraki Dashboard API]
        H[Organization]
        I[Networks]
        J[SSIDs]
        K[Access Points]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    D --> F
    D --> G
    G --> H
    H --> I
    I --> J
    I --> K
```

### Componentes

```mermaid
graph LR
    subgraph Apresentacao
        CLI[Ansible CLI]
    end

    subgraph Orquestracao
        PB[Playbook]
        PRE[Pre-tasks]
        POST[Post-tasks]
    end

    subgraph Logica
        ROLE[Role]
        T1[Tasks Org]
        T2[Tasks Redes]
        T3[Tasks SSIDs]
        T4[Tasks APs]
    end

    subgraph Dados
        CFG[Config YAML]
        VLT[Vault]
        DEF[Defaults]
    end

    subgraph Externo
        API[Meraki API]
    end

    CLI --> PB
    PB --> PRE
    PB --> ROLE
    PB --> POST
    ROLE --> T1
    ROLE --> T2
    ROLE --> T3
    ROLE --> T4
    T1 --> CFG
    T1 --> VLT
    T1 --> DEF
    T1 --> API
    T2 --> API
    T3 --> API
    T4 --> API
```

---

## Fluxo de Autenticacao

### Validacao da API Key

```mermaid
sequenceDiagram
    participant O as Operador
    participant A as Ansible
    participant V as Vault
    participant M as Meraki API

    O->>A: Executa playbook
    A->>V: Solicita API Key
    V-->>A: API Key
    A->>A: Valida API Key
    A->>M: GET /organizations
    M-->>A: 200 OK
    A-->>O: Continua execucao
```

### Processo de Descriptografia

```mermaid
flowchart TD
    A[Inicio] --> B{Vault criptografado?}
    B -->|Sim| C{Senha fornecida?}
    B -->|Nao| D[Carrega variaveis]
    C -->|Sim| E[Descriptografa]
    C -->|Nao| F[Erro]
    E --> G{Senha correta?}
    G -->|Sim| D
    G -->|Nao| F
    D --> H[Continua]
    F --> I[Fim com erro]
    H --> J[Fim com sucesso]
```

---

## Fluxo de Provisionamento

### Fluxo Principal

```mermaid
flowchart TD
    A[Inicio] --> B[Carregar Variaveis]
    B --> C{Variaveis validas?}
    C -->|Nao| D[Erro]
    C -->|Sim| E[Verificar Org]
    E --> F{Org existe?}
    F -->|Nao| G[Criar Org]
    F -->|Sim| H[Usar Org]
    G --> I[Obter Org ID]
    H --> I
    I --> J[Verificar Redes]
    J --> K{Redes existem?}
    K -->|Nao| L[Criar Redes]
    K -->|Sim| M[Usar Redes]
    L --> N[Consolidar IDs]
    M --> N
    N --> O[Configurar SSIDs]
    O --> P[Claim APs]
    P --> Q[Aguardar 5s]
    Q --> R[Adicionar APs]
    R --> S[Configurar APs]
    S --> T[Exibir Resumo]
    T --> U[Fim]
    D --> V[Fim com erro]
```

### Criacao de Rede

```mermaid
sequenceDiagram
    participant A as Ansible
    participant M as Meraki API

    A->>M: GET /organizations/ORG/networks
    M-->>A: Lista de redes

    loop Para cada rede
        A->>A: Rede existe?
        A->>M: POST /organizations/ORG/networks
        M-->>A: 201 Network ID
    end

    A->>A: Consolidar Network IDs
```

---

## Fluxo de Configuracao de SSIDs

### Processo de Configuracao

```mermaid
flowchart TD
    A[Inicio] --> B[Para cada Rede]
    B --> C{Tem wireless?}
    C -->|Nao| D[Pular]
    C -->|Sim| E[Para cada SSID]
    E --> F[Montar payload]
    F --> G{Auth Mode?}
    G -->|open| H[Sem senha]
    G -->|psk| I[Com PSK]
    H --> J[PUT SSID]
    I --> J
    J --> K{Sucesso?}
    K -->|Sim| L[Configurado]
    K -->|Nao| M[Erro]
    L --> N{Mais SSIDs?}
    M --> N
    N -->|Sim| E
    N -->|Nao| O{Mais redes?}
    D --> O
    O -->|Sim| B
    O -->|Nao| P[Fim]
```

---

## Fluxo de Access Points

### Claim e Configuracao

```mermaid
sequenceDiagram
    participant A as Ansible
    participant M as Meraki API

    A->>A: Coletar seriais
    A->>M: POST /organizations/ORG/inventory/claim
    M-->>A: 200 OK

    A->>A: Aguardar 5 segundos

    loop Para cada rede
        A->>M: POST /networks/NET/devices/claim
        M-->>A: 200 OK
    end

    loop Para cada AP
        A->>M: PUT /devices/SERIAL
        M-->>A: 200 OK
    end
```

---

## Fluxo de Seguranca

### Ciclo de Vida de Credenciais

```mermaid
flowchart TD
    subgraph Criacao
        A[Gerar API Key] --> B[Criar vault.yml]
        B --> C[Criptografar]
    end

    subgraph Armazenamento
        C --> D[vault.yml seguro]
        D --> E[Commit seguro]
    end

    subgraph Uso
        E --> F[Ansible carrega]
        F --> G[Descriptografa]
        G --> H[API Key em memoria]
        H --> I[Usar em requisicoes]
    end

    subgraph Rotacao
        J[Nova API Key] --> K[Atualizar vault]
        K --> L[Re-criptografar]
        L --> M[Revogar antiga]
    end

    I -.-> J
```

### Validacao de Entrada

```mermaid
flowchart TD
    A[Input] --> B{API Key?}
    B -->|Nao| C[ERRO]
    B -->|Sim| D{Config?}
    D -->|Nao| E[ERRO]
    D -->|Sim| F{Org name?}
    F -->|Nao| G[ERRO]
    F -->|Sim| H{Networks?}
    H -->|Nao| I[ERRO]
    H -->|Sim| J[OK]
    J --> K[Continuar]
    C --> L[Fim erro]
    E --> L
    G --> L
    I --> L
```

---

## Diagrama de Estados

### Estados do Provisionamento

```mermaid
stateDiagram-v2
    [*] --> Iniciando
    Iniciando --> Validando
    Validando --> Erro
    Validando --> ProvisionandoOrg
    ProvisionandoOrg --> ProvisionandoRedes
    ProvisionandoOrg --> Erro
    ProvisionandoRedes --> ConfigurandoSSIDs
    ProvisionandoRedes --> Erro
    ConfigurandoSSIDs --> ClaimandoAPs
    ConfigurandoSSIDs --> Erro
    ClaimandoAPs --> ConfigurandoAPs
    ClaimandoAPs --> Erro
    ConfigurandoAPs --> Concluido
    ConfigurandoAPs --> Erro
    Concluido --> [*]
    Erro --> [*]
```

---

## Proximos Passos

- Consulte [Autenticacao e Seguranca](authentication.md) para detalhes de seguranca
- Veja [Desenvolvimento](development.md) para contribuir com o projeto
