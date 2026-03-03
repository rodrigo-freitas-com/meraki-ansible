# Release Notes

Este documento contém o histórico de versões e mudanças do projeto Meraki Ansible.

## Formato

As versões seguem o [Semantic Versioning](https://semver.org/):

- **MAJOR**: Mudanças incompatíveis com versões anteriores
- **MINOR**: Novas funcionalidades compatíveis
- **PATCH**: Correções de bugs compatíveis

---

## [1.0.0] - 2026-02-27

### Lançamento Inicial

Primeira versão estável do Meraki Ansible.

### Adicionado

#### Funcionalidades Principais

- **Gerenciamento de Organizações**
  - Verificação de organizações existentes
  - Criação automática de novas organizações
  - Configuração de timezone e notas

- **Gerenciamento de Redes**
  - Criação de redes com múltiplos tipos de produto (wireless, switch, appliance)
  - Suporte a múltiplas redes por organização
  - Configuração de tags para categorização
  - Timezone independente por rede

- **Configuração de SSIDs**
  - Suporte a múltiplos SSIDs por rede (0-14)
  - Modos de autenticação: open, psk
  - Modos de criptografia: WPA, WPA2
  - Configuração de VLAN
  - Modos de atribuição de IP: Bridge mode, NAT mode

- **Provisionamento de Access Points**
  - Claim de APs na organização
  - Atribuição de APs às redes
  - Configuração de nome e tags
  - Configuração de localização (GPS e endereço)
  - Suporte a notas/observações

#### Estrutura do Projeto

- Playbook principal: `meraki_provision.yml`
- Role: `meraki_provisioning`
- Sistema de tags para execução seletiva
- Suporte a Ansible Vault para credenciais

#### Documentação

- README.md com instruções básicas
- Exemplo de configuração: `cliente_abc.yml`
- Template de configuração: `vars/meraki_config.yml`

### Tags Disponíveis

| Tag | Descrição |
|-----|-----------|
| `org` | Gerenciamento de organização |
| `networks` | Criação de redes |
| `ssids` | Configuração de SSIDs |
| `aps` | Claim e atribuição de APs |
| `ap_config` | Configuração de APs |
| `rf` | Perfis de RF |
| `always` | Executa com org |

### Requisitos

- Ansible 2.9+
- Python 3.8+
- API Key do Meraki Dashboard

### Notas

- Primeira versão pública
- Testado com Meraki Dashboard API v1
- Suporte a múltiplas localidades

---

## Versões Futuras (Roadmap)

### [1.1.0] - Planejado

#### Planejado

- [ ] Suporte a configuração de VLANs
- [ ] Suporte a configuração de Firewall rules
- [ ] Suporte a MX Appliance settings
- [ ] Testes automatizados com Molecule
- [ ] Callback plugins para logging

### [1.2.0] - Planejado

#### Planejado

- [ ] Suporte a Switch port configuration
- [ ] Suporte a Site-to-site VPN
- [ ] Integração com Meraki MT sensors
- [ ] Dashboard para visualização de estado

### [2.0.0] - Planejado

#### Planejado

- [ ] Refatoração para usar módulos nativos cisco.meraki
- [ ] Suporte a Meraki Organizations API v1.1
- [ ] Inventário dinâmico
- [ ] Playbooks separados por funcionalidade

---

## Guia de Migração

### De versões anteriores

Esta é a primeira versão pública. Para projetos existentes:

1. Backup das configurações atuais
2. Adaptar formato de variáveis para o novo schema
3. Testar em ambiente de homologação
4. Aplicar em produção

---

## Changelog Detalhado

### Commits da v1.0.0

```
d943029 first commit
```

---

## Como Atualizar

### Via Git

```bash
# Salvar alterações locais
git stash

# Atualizar
git fetch origin
git checkout main
git pull origin main

# Restaurar alterações locais
git stash pop
```

### Verificar Versão

```bash
# Via Git
git describe --tags

# Via README
head -20 README.md
```

---

## Suporte

### Versões Suportadas

| Versão | Status | Suporte até |
|--------|--------|-------------|
| 1.0.x | Ativa | Atual |

### Política de Suporte

- **Versão atual**: Correções de bugs e segurança
- **Versão anterior**: Apenas correções de segurança
- **Versões antigas**: Sem suporte

---

## Contribuições

Veja [Contributing](contributing.md) para informações sobre como contribuir.

---

## Contato

- **Autor**: Freitas
- **E-mail**: contato@rodrigo-freitas.com
- **Issues**: GitHub Issues do repositório
