# Meraki Ansible Provisioning

Automação completa de provisionamento Cisco Meraki via Ansible by Freitas

## Estrutura

```
meraki-ansible/
├── ansible.cfg
├── meraki_provision.yml          # ← Playbook principal
├── inventory/
│   └── hosts.ini
├── vars/
│   ├── meraki_config.yml         # ← Edite o arquivo de configurações
│   └── vault.yml                 # ← Chave API (criptografar com ansible-vault)
|   └── cliente_abc.yml           # ← Apenas um modelo (guia)
└── roles/
    └── meraki_provisioning/
        ├── defaults/main.yml
        └── tasks/main.yml
```

## Configuração

### 1. Edite o arquivo de variáveis

```yaml
# vars/meraki_config.yml
meraki_config:
  organization:
    name: "Empresa XPTO"
    timezone: "America/Sao_Paulo"
  networks:
    - name: "Network XPTO"
      product_types: [wireless, switch]
      ssids:
        - number: 0
          name: "SSID-01"
          auth_mode: psk
          psk: "Senha-SSID"
      access_points:
        - name: "AP-XPTO-01"
          serial: "XXXX-XXXX-XXXX" #CloudId
```

### 2. Configure as credenciais

**Opção A - Variável de ambiente:**
```bash
export MERAKI_API_KEY="Chave_API"
```

**Opção B - Ansible Vault (recomendado):**
```bash
ansible-vault encrypt vars/vault.yml
```

## Execução

```bash

# Com vault (recomendado)
ansible-playbook meraki_provision.yml \
  -e @vars/vault.yml \
  -e @vars/meraki_config.yml \
  --ask-vault-pass


# Com variável de ambiente
ansible-playbook meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e @vars/meraki_config.yml



# Arquivo de vars customizado

ansible-playbook meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e meraki_vars_file=vars/cliente_abc.yml


# Executar apenas criação de networks

ansible-playbook meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e @vars/meraki_config.yml \
  --tags networks


# Executar apenas configuração de AP's

ansible-playbook meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e @vars/meraki_config.yml \
  --tags aps
```

## Tags disponíveis

| Tag        | Descrição                          |
|------------|------------------------------------|
| `org`      | Criação/verificação da organização |
| `networks` | Criação de networks                |
| `ssids`    | Configuração de SSIDs              |
| `aps`      | Claim e adição de APs às networks  |
| `ap_config`| Configuração individual dos APs    |
| `rf`       | Configuração de perfil de rádio    |

By Freitas 
