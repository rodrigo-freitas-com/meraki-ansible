# Visão Geral

## Introdução

O **Meraki Ansible** é um framework de automação desenvolvido para simplificar e padronizar o provisionamento de infraestrutura Cisco Meraki. Utilizando Ansible como engine de automação, o projeto permite configurar organizações, redes, SSIDs e Access Points de forma declarativa e idempotente.

## Objetivo

O principal objetivo deste projeto é:

1. **Automatizar** o provisionamento de equipamentos Cisco Meraki
2. **Padronizar** configurações entre múltiplas localidades
3. **Documentar** a infraestrutura como código (IaC)
4. **Reduzir** erros humanos em configurações manuais
5. **Acelerar** o tempo de implantação de novos sites

## Funcionalidades Principais

### Gerenciamento de Organizações

- Verificação de organizações existentes
- Criação automática de novas organizações
- Configuração de timezone e metadados

### Gerenciamento de Redes

- Criação de redes com múltiplos tipos de produto (wireless, switch, appliance)
- Suporte a múltiplas redes por organização
- Configuração de tags para categorização
- Timezone independente por rede

### Configuração de SSIDs

- Suporte a múltiplos SSIDs por rede
- Modos de autenticação:
  - Open (aberto)
  - PSK (Pre-Shared Key)
- Modos de criptografia:
  - WPA
  - WPA2
- Configuração de VLAN
- Modos de atribuição de IP (Bridge, NAT)

### Provisionamento de Access Points

- Claim de APs na organização
- Atribuição de APs às redes
- Configuração individual de cada AP:
  - Nome do dispositivo
  - Tags
  - Coordenadas GPS (latitude/longitude)
  - Endereço físico
  - Notas/observações
- Configuração de perfis de RF (Radio Frequency)

## Casos de Uso

### Implantação de Nova Filial

Ideal para empresas que precisam provisionar rapidamente uma nova localidade com configurações padronizadas.

### Migração de Configurações

Permite replicar configurações de uma localidade para outra de forma consistente.

### Auditoria e Compliance

A infraestrutura como código permite rastrear mudanças e manter histórico de configurações.

### Disaster Recovery

Facilita a reconstrução rápida de configurações em caso de necessidade.

## Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                    Meraki Ansible                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Playbook   │  │   Roles     │  │    Variables        │ │
│  │  Principal  │──│  Meraki     │──│  Config + Vault     │ │
│  └─────────────┘  │ Provisioning│  └─────────────────────┘ │
│                   └─────────────┘                           │
├─────────────────────────────────────────────────────────────┤
│                    API REST (HTTPS)                         │
├─────────────────────────────────────────────────────────────┤
│                 Cisco Meraki Dashboard                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐    │
│  │Organization│  │  Networks  │  │   Access Points    │    │
│  └────────────┘  └────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Tecnologias Utilizadas

| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| Ansible | 2.9+ | Engine de automação |
| Python | 3.x | Runtime do Ansible |
| Meraki API | v1 | API REST do Meraki Dashboard |
| YAML | - | Linguagem de configuração |
| Ansible Vault | - | Criptografia de credenciais |

## Benefícios

- **Idempotência**: Execuções repetidas não causam duplicação de recursos
- **Modularidade**: Tags permitem execução seletiva de tarefas
- **Segurança**: Credenciais protegidas via Ansible Vault
- **Escalabilidade**: Suporte a múltiplas localidades em um único arquivo
- **Rastreabilidade**: Histórico de mudanças via controle de versão

## Limitações Conhecidas

- Requer acesso à API do Meraki Dashboard
- API key com permissões adequadas na organização
- Dependente da disponibilidade da API Meraki
- Não suporta configurações específicas de switch e appliance (apenas wireless)

## Próximos Passos

Consulte o guia de [Instalação](installation.md) para começar a utilizar o projeto.
