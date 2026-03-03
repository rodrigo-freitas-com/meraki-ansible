# Instalação

Este guia apresenta o processo completo de instalação do Meraki Ansible.

## Instalação Rápida

```bash
# Clone o repositório
git clone <repository-url>
cd meraki-ansible

# Verifique os requisitos
ansible --version
python3 --version
```

## Instalação Detalhada

### 1. Obter o Código

#### Via Git (Recomendado)

```bash
git clone <repository-url>
cd meraki-ansible
```

#### Via Download

1. Baixe o arquivo ZIP do repositório
2. Extraia para o diretório desejado
3. Acesse o diretório extraído

```bash
unzip meraki-ansible.zip
cd meraki-ansible
```

### 2. Instalar Dependências

#### Python e Pip

Se ainda não tiver Python instalado:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip python3-venv

# macOS
brew install python3

# CentOS/RHEL
sudo yum install python3 python3-pip
```

#### Ansible

```bash
# Instalação via pip (recomendado)
pip3 install ansible

# Verificar instalação
ansible --version
```

#### Coleções Ansible (Opcional)

Se preferir usar módulos nativos do Meraki:

```bash
ansible-galaxy collection install cisco.meraki
```

> **Nota**: Este projeto utiliza chamadas REST diretas via `ansible.builtin.uri`, não sendo necessária a instalação de coleções adicionais.

### 3. Estrutura Inicial

Após a instalação, você terá a seguinte estrutura:

```
meraki-ansible/
├── meraki_provision.yml      # Playbook principal
├── cliente_abc.yml           # Exemplo de configuração
├── inventory/
│   └── hosts.ini             # Inventário Ansible
├── roles/
│   └── meraki_provisioning/  # Role principal
│       ├── defaults/
│       │   └── main.yml
│       └── tasks/
│           └── main.yml
└── vars/
    ├── meraki_config.yml     # Template de configuração
    └── vault.yml             # Credenciais (a ser configurado)
```

### 4. Verificar Instalação

Execute o seguinte comando para verificar se tudo está correto:

```bash
# Verificar sintaxe do playbook
ansible-playbook meraki_provision.yml --syntax-check

# Listar tasks disponíveis
ansible-playbook meraki_provision.yml --list-tasks

# Listar tags disponíveis
ansible-playbook meraki_provision.yml --list-tags
```

Saída esperada para `--list-tags`:

```
playbook: meraki_provision.yml

  play #1 (localhost): Provisionar Infraestrutura Meraki	TAGS: []
      TASK TAGS: [always, ap_config, aps, networks, org, rf, ssids]
```

## Instalação em Ambiente Virtual (Recomendado)

Para isolar as dependências do projeto:

```bash
# Criar ambiente virtual
python3 -m venv venv

# Ativar ambiente virtual
# Linux/macOS
source venv/bin/activate

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Instalar Ansible no ambiente virtual
pip install ansible

# Verificar
which ansible
# Deve mostrar: /path/to/meraki-ansible/venv/bin/ansible
```

## Instalação com Docker (Alternativa)

Se preferir usar Docker:

```dockerfile
# Dockerfile
FROM python:3.11-slim

RUN pip install ansible

WORKDIR /ansible
COPY . .

ENTRYPOINT ["ansible-playbook"]
CMD ["--help"]
```

Construir e executar:

```bash
# Build da imagem
docker build -t meraki-ansible .

# Executar
docker run -v $(pwd)/vars:/ansible/vars \
  -e MERAKI_API_KEY=$MERAKI_API_KEY \
  meraki-ansible meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e @vars/meraki_config.yml
```

## Configuração Pós-Instalação

### Configurar API Key

Escolha um dos métodos:

#### Método 1: Variável de Ambiente

```bash
# Adicione ao seu ~/.bashrc ou ~/.zshrc
export MERAKI_API_KEY="sua_api_key_aqui"

# Recarregue o shell
source ~/.bashrc
```

#### Método 2: Ansible Vault (Recomendado para Produção)

```bash
# Editar o arquivo vault
nano vars/vault.yml

# Conteúdo:
# vault_meraki_api_key: "sua_api_key_aqui"

# Criptografar o arquivo
ansible-vault encrypt vars/vault.yml
```

### Configurar o Ambiente

```bash
# Copiar template de configuração
cp vars/meraki_config.yml vars/minha_config.yml

# Editar com suas configurações
nano vars/minha_config.yml
```

## Testando a Instalação

Execute um teste básico (dry-run):

```bash
# Teste sem executar (check mode)
ansible-playbook meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e @vars/meraki_config.yml \
  --check \
  --tags org
```

> **Nota**: O modo check (`--check`) não fará alterações reais, mas validará a conectividade e sintaxe.

## Solução de Problemas

### Erro: "ansible-playbook: command not found"

```bash
# Verificar se está no PATH
echo $PATH

# Adicionar ao PATH se necessário
export PATH=$PATH:~/.local/bin

# Ou reinstalar globalmente
sudo pip3 install ansible
```

### Erro: "No module named 'ansible'"

```bash
# Reinstalar Ansible
pip3 uninstall ansible
pip3 install ansible
```

### Erro de permissão ao criar arquivos

```bash
# Verificar permissões do diretório
ls -la

# Ajustar permissões se necessário
chmod -R 755 meraki-ansible/
```

## Próximos Passos

Com a instalação concluída, siga para o guia de [Configuração](configuration.md) para preparar seu ambiente.
