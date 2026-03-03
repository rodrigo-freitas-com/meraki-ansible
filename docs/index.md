# Meraki Ansible - Documentação

Bem-vindo à documentação oficial do **Meraki Ansible**, um framework de automação para provisionamento de infraestrutura Cisco Meraki utilizando Ansible.

## Sobre o Projeto

Este projeto automatiza o provisionamento completo de ambientes Cisco Meraki, incluindo:

- Criação e gerenciamento de organizações
- Configuração de redes (wireless, switch, appliance)
- Gerenciamento de SSIDs com diferentes modos de autenticação
- Provisionamento e configuração de Access Points
- Suporte a múltiplas localidades

## Navegação

### Primeiros Passos

| Documento | Descrição |
|-----------|-----------|
| [Visão Geral](overview.md) | Introdução ao projeto e suas funcionalidades |
| [Pré-requisitos](prerequisites.md) | Requisitos necessários para utilizar o projeto |
| [Instalação](installation.md) | Guia de instalação passo a passo |
| [Configuração](configuration.md) | Como configurar o projeto para seu ambiente |

### Guias Técnicos

| Documento | Descrição |
|-----------|-----------|
| [Guidelines e Padrões](guidelines.md) | Convenções e boas práticas do projeto |
| [Estrutura do Projeto](structure.md) | Organização de diretórios e arquivos |
| [API Endpoints](api-endpoints.md) | Endpoints da API Meraki utilizados |
| [Modelagem do Sistema](system-modeling.md) | Diagramas de arquitetura e fluxos |

### Segurança e Autenticação

| Documento | Descrição |
|-----------|-----------|
| [Autenticação e Segurança](authentication.md) | Gerenciamento de credenciais e segurança |

### Operações

| Documento | Descrição |
|-----------|-----------|
| [Desenvolvimento](development.md) | Guia para desenvolvedores |
| [Testes](testing.md) | Como testar as automações |
| [Deploy](deploy.md) | Implantação em produção |

### Contribuição

| Documento | Descrição |
|-----------|-----------|
| [Contribuição](contributing.md) | Como contribuir com o projeto |
| [Release Notes](release-notes.md) | Histórico de versões e mudanças |

## Início Rápido

```bash
# 1. Clone o repositório
git clone <repository-url>
cd meraki-ansible

# 2. Configure sua API key
export MERAKI_API_KEY="sua_api_key_aqui"

# 3. Edite o arquivo de configuração
cp vars/meraki_config.yml vars/minha_config.yml
# Edite vars/minha_config.yml com suas configurações

# 4. Execute o playbook
ansible-playbook meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e @vars/minha_config.yml
```

## Suporte

- **Autor**: Freitas
- **E-mail**: contato@rodrigo-freitas.com
- **Issues**: Utilize o sistema de issues do repositório

## Licença

Este projeto está licenciado sob os termos definidos no repositório.

---

*Documentação gerada para o projeto Meraki Ansible v1.0.0*
