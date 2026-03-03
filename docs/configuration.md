# Configuração do Projeto

Este guia detalha todas as opções de configuração disponíveis no Meraki Ansible.

## Estrutura de Configuração

A configuração do projeto é organizada em três camadas:

```
┌─────────────────────────────────────────┐
│     Linha de Comando (-e flags)         │  ← Maior prioridade
├─────────────────────────────────────────┤
│     vars/vault.yml (credenciais)        │
├─────────────────────────────────────────┤
│     vars/meraki_config.yml (config)     │
├─────────────────────────────────────────┤
│     roles/*/defaults/main.yml           │  ← Menor prioridade
└─────────────────────────────────────────┘
```

## Arquivo de Configuração Principal

O arquivo `vars/meraki_config.yml` contém toda a configuração do ambiente a ser provisionado.

### Estrutura Completa

```yaml
meraki_config:
  organization:
    name: "Nome da Organização"
    timezone: "America/Sao_Paulo"
    notes: "Descrição da organização"

  networks:
    - name: "Nome-da-Rede"
      product_types:
        - wireless
        - switch
        - appliance
      timezone: "America/Sao_Paulo"
      tags:
        - tag1
        - tag2
      notes: "Descrição da rede"

      ssids:
        - number: 0
          name: "SSID-Corporativo"
          enabled: true
          auth_mode: "psk"
          encryption_mode: "wpa"
          wpa_encryption_mode: "WPA2 only"
          psk: "senha_segura_aqui"
          ip_assignment_mode: "Bridge mode"
          default_vlan_id: 10

      access_points:
        - name: "AP-Recepcao"
          serial: "XXXX-XXXX-XXXX"
          tags:
            - recepcao
            - andar1
          address: "Rua Exemplo, 123 - São Paulo, SP"
          lat: -23.550520
          lng: -46.633308
          notes: "AP da recepção principal"
```

## Configuração da Organização

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `name` | string | Sim | Nome da organização no Meraki |
| `timezone` | string | Não | Fuso horário (padrão: America/Sao_Paulo) |
| `notes` | string | Não | Descrição ou notas sobre a organização |

### Exemplo

```yaml
organization:
  name: "Empresa ABC Ltda"
  timezone: "America/Sao_Paulo"
  notes: "Organização principal - Produção"
```

### Timezones Comuns no Brasil

| Região | Timezone |
|--------|----------|
| São Paulo, Rio de Janeiro, Brasília | America/Sao_Paulo |
| Manaus | America/Manaus |
| Cuiabá | America/Cuiaba |
| Rio Branco | America/Rio_Branco |
| Fortaleza, Recife | America/Fortaleza |

## Configuração de Redes

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `name` | string | Sim | Nome único da rede |
| `product_types` | array | Sim | Tipos de produto (wireless, switch, appliance) |
| `timezone` | string | Não | Fuso horário da rede |
| `tags` | array | Não | Tags para categorização |
| `notes` | string | Não | Descrição da rede |
| `ssids` | array | Não | Configurações de SSIDs |
| `access_points` | array | Não | Lista de APs |

### Exemplo Multi-Localidade

```yaml
networks:
  # Sede Principal
  - name: "SEDE-SP"
    product_types:
      - wireless
    timezone: "America/Sao_Paulo"
    tags:
      - producao
      - sede
    notes: "Rede da sede em São Paulo"
    ssids:
      - number: 0
        name: "Corp-SP"
        enabled: true
        auth_mode: "psk"
        psk: "senha123"
    access_points:
      - name: "AP-SEDE-01"
        serial: "Q2AB-CDEF-1234"

  # Filial
  - name: "FILIAL-RJ"
    product_types:
      - wireless
    timezone: "America/Sao_Paulo"
    tags:
      - producao
      - filial
    notes: "Filial Rio de Janeiro"
```

## Configuração de SSIDs

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `number` | integer | Sim | Número do SSID (0-14) |
| `name` | string | Sim | Nome do SSID (visível aos usuários) |
| `enabled` | boolean | Sim | SSID ativo ou inativo |
| `auth_mode` | string | Não | Modo de autenticação |
| `encryption_mode` | string | Não | Modo de criptografia |
| `wpa_encryption_mode` | string | Não | Versão do WPA |
| `psk` | string | Condicional | Senha (obrigatório se auth_mode=psk) |
| `ip_assignment_mode` | string | Não | Modo de atribuição de IP |
| `default_vlan_id` | integer | Não | VLAN padrão |

### Modos de Autenticação

| Modo | Descrição |
|------|-----------|
| `open` | Rede aberta, sem autenticação |
| `psk` | Pre-Shared Key (senha compartilhada) |

### Modos de Criptografia

| Modo | Descrição |
|------|-----------|
| `wpa` | WPA (menos seguro, legado) |
| `wpa-eap` | WPA Enterprise |

### Modos WPA

| Modo | Descrição |
|------|-----------|
| `WPA1 only` | Apenas WPA1 (não recomendado) |
| `WPA1 and WPA2` | Compatibilidade |
| `WPA2 only` | Apenas WPA2 (recomendado) |
| `WPA3 Transition Mode` | WPA2/WPA3 |
| `WPA3 only` | Apenas WPA3 |

### Modos de Atribuição de IP

| Modo | Descrição |
|------|-----------|
| `Bridge mode` | Clientes na mesma VLAN da rede |
| `NAT mode` | NAT no AP |
| `Layer 3 roaming` | Roaming entre APs |

### Exemplo de SSIDs

```yaml
ssids:
  # SSID Corporativo
  - number: 0
    name: "Empresa-Corp"
    enabled: true
    auth_mode: "psk"
    encryption_mode: "wpa"
    wpa_encryption_mode: "WPA2 only"
    psk: "SenhaSegura2024!"
    ip_assignment_mode: "Bridge mode"
    default_vlan_id: 100

  # SSID Visitantes
  - number: 1
    name: "Empresa-Guest"
    enabled: true
    auth_mode: "open"
    ip_assignment_mode: "NAT mode"

  # SSID IoT (desabilitado)
  - number: 2
    name: "Empresa-IoT"
    enabled: false
```

## Configuração de Access Points

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `name` | string | Sim | Nome do dispositivo |
| `serial` | string | Sim | Número de série do AP |
| `tags` | array | Não | Tags para categorização |
| `address` | string | Não | Endereço físico |
| `lat` | float | Não | Latitude (coordenada GPS) |
| `lng` | float | Não | Longitude (coordenada GPS) |
| `notes` | string | Não | Observações |
| `rf_profile_id` | string | Não | ID do perfil de RF |

### Exemplo

```yaml
access_points:
  - name: "AP-ANDAR1-RECEPCAO"
    serial: "Q2AB-1234-ABCD"
    tags:
      - andar1
      - recepcao
      - indoor
    address: "Av. Paulista, 1000 - 1º Andar - São Paulo, SP"
    lat: -23.561684
    lng: -46.655981
    notes: "AP principal da recepção - Cobertura área de espera"

  - name: "AP-ANDAR1-SALA-REUNIAO"
    serial: "Q2AB-5678-EFGH"
    tags:
      - andar1
      - sala-reuniao
    address: "Av. Paulista, 1000 - 1º Andar - São Paulo, SP"
    lat: -23.561700
    lng: -46.656000
    notes: "Sala de reunião principal"
```

## Variáveis Padrão

Definidas em `roles/meraki_provisioning/defaults/main.yml`:

```yaml
# URL base da API Meraki
meraki_base_url: "https://api.meraki.com/api/v1"

# Tempo de espera após claim de APs (segundos)
meraki_claim_wait: 5
```

## Configuração de Credenciais

### Via Ansible Vault (Recomendado)

```yaml
# vars/vault.yml
vault_meraki_api_key: "sua_api_key_secreta"
```

Criptografar:

```bash
ansible-vault encrypt vars/vault.yml
```

### Via Variável de Ambiente

```bash
export MERAKI_API_KEY="sua_api_key"
```

## Usando Arquivos de Configuração Customizados

### Criando Configuração por Cliente

```bash
# Copiar template
cp vars/meraki_config.yml vars/cliente_xyz.yml

# Editar configuração
nano vars/cliente_xyz.yml

# Executar com arquivo customizado
ansible-playbook meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e meraki_vars_file=vars/cliente_xyz.yml
```

### Estrutura Sugerida para Múltiplos Clientes

```
vars/
├── meraki_config.yml      # Template
├── cliente_abc.yml        # Cliente ABC
├── cliente_xyz.yml        # Cliente XYZ
├── producao.yml           # Ambiente de produção
├── homologacao.yml        # Ambiente de homologação
└── vault.yml              # Credenciais (criptografado)
```

## Validação de Configuração

Antes de executar, valide sua configuração:

```bash
# Verificar sintaxe YAML
python3 -c "import yaml; yaml.safe_load(open('vars/minha_config.yml'))"

# Verificar variáveis
ansible-playbook meraki_provision.yml \
  -e @vars/minha_config.yml \
  --list-tasks

# Dry-run
ansible-playbook meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e @vars/minha_config.yml \
  --check
```

## Próximos Passos

- Consulte [Guidelines e Padrões](guidelines.md) para boas práticas
- Veja a [Estrutura do Projeto](structure.md) para entender a organização dos arquivos
