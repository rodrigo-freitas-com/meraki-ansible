# Guidelines e Padrões

Este documento estabelece as convenções, boas práticas e padrões a serem seguidos no projeto Meraki Ansible.

## Convenções de Nomenclatura

### Arquivos YAML

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Playbooks | snake_case.yml | `meraki_provision.yml` |
| Variáveis | snake_case.yml | `meraki_config.yml` |
| Configurações de cliente | cliente_nome.yml | `cliente_abc.yml` |
| Vault | vault.yml | `vault.yml` |

### Variáveis Ansible

```yaml
# ✅ Correto - snake_case
meraki_api_key: "..."
meraki_config: {}
org_id: "123"

# ❌ Incorreto
MerakiApiKey: "..."
meraki-config: {}
orgId: "123"
```

### Nomes de Redes

```yaml
# ✅ Recomendado - Padrão com localidade
networks:
  - name: "SEDE-SP"
  - name: "FILIAL-RJ"
  - name: "FILIAL-BH"

# ✅ Alternativa - Com tipo
networks:
  - name: "CORP-ESCRITORIO-SP"
  - name: "CORP-LOJA-RJ"
```

### Nomes de SSIDs

```yaml
# ✅ Recomendado
ssids:
  - name: "Empresa-Corp"      # Corporativo
  - name: "Empresa-Guest"     # Visitantes
  - name: "Empresa-IoT"       # Dispositivos IoT

# ❌ Evitar
ssids:
  - name: "wifi"              # Muito genérico
  - name: "SSID 1"            # Não descritivo
```

### Nomes de Access Points

```yaml
# ✅ Padrão recomendado: TIPO-LOCAL-DETALHE
access_points:
  - name: "AP-ANDAR1-RECEPCAO"
  - name: "AP-ANDAR2-SALA-TI"
  - name: "AP-EXTERNO-ESTACIONAMENTO"

# ✅ Alternativa com código
access_points:
  - name: "AP-SP01-001"        # SP, prédio 01, AP 001
  - name: "AP-RJ01-001"
```

## Organização de Arquivos

### Estrutura de Diretórios

```
meraki-ansible/
├── docs/                     # Documentação
├── inventory/                # Inventários Ansible
├── roles/                    # Roles reutilizáveis
│   └── meraki_provisioning/
│       ├── defaults/         # Valores padrão
│       ├── tasks/            # Tarefas
│       ├── templates/        # Templates Jinja2 (se necessário)
│       └── handlers/         # Handlers (se necessário)
├── vars/                     # Variáveis
│   ├── meraki_config.yml     # Template
│   ├── vault.yml             # Credenciais
│   └── cliente_*.yml         # Configs por cliente
└── *.yml                     # Playbooks
```

### Separação de Responsabilidades

| Diretório/Arquivo | Responsabilidade |
|-------------------|------------------|
| `playbooks/` | Orquestração de alto nível |
| `roles/` | Lógica de automação reutilizável |
| `vars/` | Dados de configuração |
| `inventory/` | Definição de hosts |

## Padrões de Código YAML

### Indentação

```yaml
# ✅ Correto - 2 espaços
networks:
  - name: "SEDE-SP"
    ssids:
      - number: 0
        name: "Corp"

# ❌ Incorreto - tabs ou indentação inconsistente
networks:
	- name: "SEDE-SP"
    ssids:
        - number: 0
```

### Strings

```yaml
# ✅ Usar aspas duplas para strings com caracteres especiais
name: "Rede - Produção"
notes: "Configuração: VLAN 100"

# ✅ Sem aspas para strings simples (opcional)
name: SEDE-SP
timezone: America/Sao_Paulo

# ❌ Evitar aspas simples (inconsistência)
name: 'SEDE-SP'
```

### Booleanos

```yaml
# ✅ Usar true/false em minúsculas
enabled: true
enabled: false

# ❌ Evitar alternativas
enabled: yes
enabled: True
enabled: "true"
```

### Listas

```yaml
# ✅ Formato preferido para listas curtas
tags: ["producao", "wireless"]

# ✅ Formato preferido para listas longas
tags:
  - producao
  - wireless
  - sede
  - andar1
```

## Segurança

### Credenciais

```yaml
# ✅ SEMPRE usar Ansible Vault para credenciais
# vars/vault.yml (criptografado)
vault_meraki_api_key: "api_key_secreta"

# ❌ NUNCA commitar credenciais em texto plano
meraki_api_key: "minha_api_key"  # NÃO FAZER ISSO
```

### Senhas de SSIDs

```yaml
# ✅ Usar senhas fortes (mínimo 12 caracteres)
psk: "SenhaSegura2024!@#"

# ❌ Evitar senhas fracas
psk: "12345678"
psk: "senha123"
```

### .gitignore

```gitignore
# Sempre incluir no .gitignore
vars/vault.yml
*.vault
.env
*.pem
*.key
```

## Boas Práticas de Automação

### Idempotência

Todas as tarefas devem ser idempotentes:

```yaml
# ✅ Verificar antes de criar
- name: Verificar se organização existe
  uri:
    url: "{{ meraki_base_url }}/organizations"
    method: GET
  register: existing_orgs

- name: Criar organização se não existir
  uri:
    url: "{{ meraki_base_url }}/organizations"
    method: POST
  when: org_name not in existing_orgs
```

### Uso de Tags

```yaml
# ✅ Usar tags para execução seletiva
- name: Criar rede
  uri:
    url: "..."
  tags:
    - networks
    - always
```

### Tratamento de Erros

```yaml
# ✅ Validar entradas obrigatórias
- name: Validar variáveis obrigatórias
  assert:
    that:
      - meraki_api_key is defined
      - meraki_api_key | length > 0
    fail_msg: "meraki_api_key é obrigatória"

# ✅ Ignorar erros quando apropriado
- name: Tentar operação
  uri:
    url: "..."
  register: result
  ignore_errors: yes

- name: Tratar falha
  debug:
    msg: "Operação falhou: {{ result.msg }}"
  when: result is failed
```

### Debug e Logging

```yaml
# ✅ Incluir mensagens de debug úteis
- name: Exibir status da organização
  debug:
    msg: "Org ID: {{ org_id }} | Nome: {{ org_name }}"

# ✅ Usar verbosity levels
- name: Debug detalhado
  debug:
    var: api_response
    verbosity: 2  # Só aparece com -vv ou mais
```

## Padrões de Configuração

### Configuração por Ambiente

```yaml
# vars/producao.yml
meraki_config:
  organization:
    name: "Empresa - Produção"
    notes: "Ambiente de produção - NÃO MODIFICAR MANUALMENTE"

# vars/homologacao.yml
meraki_config:
  organization:
    name: "Empresa - Homologação"
    notes: "Ambiente de testes"
```

### Configuração por Cliente

```yaml
# vars/cliente_abc.yml
meraki_config:
  organization:
    name: "Cliente ABC"
  networks:
    - name: "ABC-SEDE"
    - name: "ABC-FILIAL"
```

## Documentação

### Comentários em YAML

```yaml
# ✅ Comentar seções importantes
meraki_config:
  organization:
    name: "Empresa ABC"
    # Timezone deve seguir formato IANA
    # Lista: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
    timezone: "America/Sao_Paulo"

  networks:
    - name: "SEDE-SP"
      # Tipos disponíveis: wireless, switch, appliance, cellularGateway
      product_types:
        - wireless
```

### README por Diretório

Cada diretório significativo deve ter um README.md explicando seu propósito.

## Versionamento

### Commits

```bash
# ✅ Mensagens descritivas
git commit -m "feat: adiciona suporte a múltiplas VLANs por SSID"
git commit -m "fix: corrige timeout na API de claim"
git commit -m "docs: atualiza documentação de configuração"

# ❌ Mensagens vagas
git commit -m "update"
git commit -m "fix bug"
```

### Branches

```bash
# Padrão sugerido
main           # Código estável
develop        # Desenvolvimento
feature/*      # Novas funcionalidades
fix/*          # Correções
```

## Checklist de Qualidade

Antes de commitar ou executar em produção:

- [ ] Variáveis sensíveis estão no vault (criptografado)?
- [ ] Sintaxe YAML validada?
- [ ] Playbook executa sem erros em check mode?
- [ ] Tags estão definidas corretamente?
- [ ] Documentação atualizada?
- [ ] Nomes seguem convenções?
- [ ] Senhas são fortes (mínimo 12 caracteres)?

## Próximos Passos

- Veja a [Estrutura do Projeto](structure.md) para detalhes sobre cada arquivo
- Consulte [API Endpoints](api-endpoints.md) para referência da API Meraki
