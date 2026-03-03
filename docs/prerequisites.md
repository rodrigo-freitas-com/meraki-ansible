# Pré-requisitos

Este documento lista todos os requisitos necessários para utilizar o Meraki Ansible.

## Requisitos de Sistema

### Sistema Operacional

O projeto é compatível com os seguintes sistemas operacionais:

- **Linux** (Ubuntu, CentOS, RHEL, Debian)
- **macOS** (10.15+)
- **Windows** (via WSL2)

### Python

| Requisito | Versão Mínima | Recomendado |
|-----------|---------------|-------------|
| Python | 3.8 | 3.10+ |
| pip | 20.0+ | Última versão |

Verifique sua versão do Python:

```bash
python3 --version
```

### Ansible

| Requisito | Versão Mínima | Recomendado |
|-----------|---------------|-------------|
| Ansible | 2.9 | 2.14+ |
| ansible-core | 2.12+ | 2.15+ |

Verifique sua versão do Ansible:

```bash
ansible --version
```

## Requisitos de Rede

### Conectividade

- Acesso à internet para comunicação com a API Meraki
- Porta **443 (HTTPS)** liberada para saída
- Resolução DNS para `api.meraki.com`

### Firewall

Certifique-se de que as seguintes URLs estão acessíveis:

| URL | Protocolo | Finalidade |
|-----|-----------|------------|
| `api.meraki.com` | HTTPS (443) | API REST Meraki |
| `dashboard.meraki.com` | HTTPS (443) | Dashboard (opcional) |

## Requisitos do Cisco Meraki

### Conta e Organização

1. **Conta Meraki Dashboard**: Acesso ao portal dashboard.meraki.com
2. **Organização**: Permissões de administrador na organização alvo
3. **Licenças**: Licenças ativas para os dispositivos a serem provisionados

### API Key

Uma API Key válida é obrigatória para utilizar este projeto.

#### Como Obter a API Key

1. Acesse o [Meraki Dashboard](https://dashboard.meraki.com)
2. Navegue até **Organization > Settings**
3. Role até a seção **Dashboard API access**
4. Clique em **Enable access to the Cisco Meraki Dashboard API**
5. Navegue até seu perfil (canto superior direito)
6. Clique em **My Profile**
7. Role até **API access**
8. Clique em **Generate new API key**
9. Copie e guarde a chave em local seguro

> **Importante**: A API key é exibida apenas uma vez. Armazene-a de forma segura.

#### Permissões da API Key

A API Key deve ter as seguintes permissões:

| Permissão | Necessária Para |
|-----------|-----------------|
| Organization Admin | Criar organizações |
| Network Admin | Criar e configurar redes |
| Device Management | Claim e configurar APs |

### Dispositivos

Para provisionamento de Access Points:

- **Serial Numbers**: Números de série dos APs a serem provisionados
- **Claim Status**: APs devem estar disponíveis para claim (não associados a outra organização)

## Requisitos de Conhecimento

### Obrigatórios

- Conhecimento básico de **linha de comando** (terminal/shell)
- Familiaridade com **YAML** (formato de configuração)
- Entendimento básico de **redes Wi-Fi** (SSIDs, PSK, VLANs)

### Recomendados

- Experiência com **Ansible** (playbooks, roles, variáveis)
- Conhecimento do **Cisco Meraki Dashboard**
- Noções de **APIs REST**
- Familiaridade com **Git** para controle de versão

## Checklist de Verificação

Use esta lista para verificar se seu ambiente está pronto:

```bash
# 1. Verificar Python
python3 --version
# Esperado: Python 3.8+

# 2. Verificar Ansible
ansible --version
# Esperado: ansible 2.9+

# 3. Testar conectividade com API Meraki
curl -s -o /dev/null -w "%{http_code}" https://api.meraki.com/api/v1/organizations \
  -H "X-Cisco-Meraki-API-Key: SUA_API_KEY"
# Esperado: 200

# 4. Verificar Git (opcional, mas recomendado)
git --version
# Esperado: git version 2.x
```

## Problemas Comuns

### Python não encontrado

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install python3 python3-pip

# macOS
brew install python3

# CentOS/RHEL
sudo yum install python3 python3-pip
```

### Ansible não encontrado

```bash
# Via pip (recomendado)
pip3 install ansible

# Ubuntu/Debian
sudo apt install ansible

# macOS
brew install ansible
```

### Erro de conectividade com API

1. Verifique sua conexão com a internet
2. Confirme que a porta 443 está liberada no firewall
3. Teste com `ping api.meraki.com`
4. Verifique se há proxy configurado que possa bloquear

### API Key inválida

1. Confirme que a API está habilitada na organização
2. Gere uma nova API key
3. Verifique se não há espaços em branco antes/depois da key
4. Confirme as permissões da conta

## Próximos Passos

Com todos os pré-requisitos atendidos, siga para o guia de [Instalação](installation.md).
