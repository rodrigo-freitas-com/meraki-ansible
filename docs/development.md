# Desenvolvimento

Este guia fornece informações para desenvolvedores que desejam contribuir ou estender o projeto Meraki Ansible.

## Ambiente de Desenvolvimento

### Configuração Inicial

```bash
# 1. Clone o repositório
git clone <repository-url>
cd meraki-ansible

# 2. Crie um ambiente virtual Python
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# ou
.\venv\Scripts\activate   # Windows

# 3. Instale as dependências
pip install ansible ansible-lint yamllint

# 4. Verifique a instalação
ansible --version
ansible-lint --version
yamllint --version
```

### Estrutura do Ambiente

```
meraki-ansible/
├── venv/                    # Ambiente virtual (não versionado)
├── .git/                    # Repositório Git
├── .gitignore               # Arquivos ignorados
├── docs/                    # Documentação
├── inventory/               # Inventários
├── roles/                   # Roles
├── vars/                    # Variáveis
└── *.yml                    # Playbooks
```

## Ferramentas de Desenvolvimento

### Ansible Lint

Verifica boas práticas em playbooks e roles.

```bash
# Instalar
pip install ansible-lint

# Executar verificação
ansible-lint meraki_provision.yml
ansible-lint roles/meraki_provisioning/

# Ignorar regras específicas (se necessário)
ansible-lint --skip-list yaml[truthy],no-changed-when
```

### YAML Lint

Valida sintaxe YAML.

```bash
# Instalar
pip install yamllint

# Criar arquivo de configuração
cat > .yamllint << 'EOF'
extends: default
rules:
  line-length:
    max: 120
  truthy:
    allowed-values: ['true', 'false', 'yes', 'no']
EOF

# Executar
yamllint .
yamllint vars/meraki_config.yml
```

### VS Code Extensions

Extensões recomendadas para VS Code:

```json
{
  "recommendations": [
    "redhat.ansible",
    "redhat.vscode-yaml",
    "ms-python.python",
    "esbenp.prettier-vscode"
  ]
}
```

Configuração de workspace (`.vscode/settings.json`):

```json
{
  "ansible.python.interpreterPath": "${workspaceFolder}/venv/bin/python",
  "yaml.schemas": {
    "https://json.schemastore.org/ansible-playbook": "*.yml"
  },
  "[yaml]": {
    "editor.tabSize": 2,
    "editor.insertSpaces": true
  }
}
```

## Desenvolvimento de Tasks

### Estrutura de uma Task

```yaml
# Estrutura padrão de task
- name: Descrição clara da ação
  ansible.builtin.uri:
    url: "{{ meraki_base_url }}/endpoint"
    method: GET|POST|PUT|DELETE
    headers:
      X-Cisco-Meraki-API-Key: "{{ meraki_api_key }}"
      Content-Type: "application/json"
    body_format: json
    body: "{{ payload }}"
    status_code: [200, 201]
  register: result
  tags:
    - tag_name
```

### Padrões para Novas Tasks

1. **Verificar antes de criar** (idempotência):
```yaml
- name: Verificar se recurso existe
  ansible.builtin.uri:
    url: "{{ meraki_base_url }}/resources"
    method: GET
  register: existing_resources

- name: Criar recurso se não existir
  ansible.builtin.uri:
    url: "{{ meraki_base_url }}/resources"
    method: POST
  when: resource_name not in existing_resources.json | map(attribute='name')
```

2. **Usar tags apropriadas**:
```yaml
- name: Task de rede
  uri: ...
  tags:
    - networks      # Tag principal
    - provision     # Tag de categoria
```

3. **Registrar resultados**:
```yaml
- name: Operação
  uri: ...
  register: operation_result

- name: Debug resultado
  debug:
    var: operation_result
    verbosity: 1
```

### Adicionando Nova Funcionalidade

#### Exemplo: Adicionar Suporte a VLANs

1. **Atualizar estrutura de configuração** (`vars/meraki_config.yml`):
```yaml
networks:
  - name: "REDE"
    vlans:
      - id: 10
        name: "VLAN-Corp"
        subnet: "10.10.10.0/24"
        applianceIp: "10.10.10.1"
```

2. **Criar tasks** (`roles/meraki_provisioning/tasks/vlans.yml`):
```yaml
---
- name: Configurar VLANs
  ansible.builtin.uri:
    url: "{{ meraki_base_url }}/networks/{{ network_id }}/vlans"
    method: POST
    headers:
      X-Cisco-Meraki-API-Key: "{{ meraki_api_key }}"
    body_format: json
    body:
      id: "{{ vlan.id }}"
      name: "{{ vlan.name }}"
      subnet: "{{ vlan.subnet }}"
      applianceIp: "{{ vlan.applianceIp }}"
    status_code: [200, 201]
  loop: "{{ network.vlans | default([]) }}"
  loop_control:
    loop_var: vlan
  tags:
    - vlans
```

3. **Incluir no main.yml**:
```yaml
# roles/meraki_provisioning/tasks/main.yml
- name: Configurar VLANs
  include_tasks: vlans.yml
  when: network.vlans is defined
  tags:
    - vlans
```

## Debug e Troubleshooting

### Níveis de Verbosidade

```bash
# Normal (sem debug)
ansible-playbook meraki_provision.yml

# Verbose (-v)
ansible-playbook meraki_provision.yml -v

# Mais detalhes (-vv)
ansible-playbook meraki_provision.yml -vv

# Debug completo (-vvv)
ansible-playbook meraki_provision.yml -vvv

# Debug de conexão (-vvvv)
ansible-playbook meraki_provision.yml -vvvv
```

### Debug de Variáveis

```yaml
# Adicionar task de debug temporária
- name: DEBUG - Mostrar variáveis
  debug:
    msg:
      - "Org ID: {{ org_id }}"
      - "Networks: {{ networks | to_nice_json }}"
  tags:
    - debug
    - never  # Só executa se explicitamente chamada
```

Executar debug:
```bash
ansible-playbook meraki_provision.yml --tags "org,debug"
```

### Modo Check (Dry Run)

```bash
# Simular execução sem fazer alterações
ansible-playbook meraki_provision.yml --check

# Mostrar diferenças
ansible-playbook meraki_provision.yml --check --diff
```

### Pausar Execução

```yaml
# Adicionar pausa para inspeção
- name: Pausar para verificação
  ansible.builtin.pause:
    prompt: "Verificar estado atual. Pressione ENTER para continuar"
```

## Testes Locais

### Teste de Sintaxe

```bash
# Verificar sintaxe do playbook
ansible-playbook meraki_provision.yml --syntax-check

# Listar tasks
ansible-playbook meraki_provision.yml --list-tasks

# Listar tags
ansible-playbook meraki_provision.yml --list-tags

# Listar hosts
ansible-playbook meraki_provision.yml --list-hosts
```

### Teste com Variáveis Mock

Crie um arquivo de teste:

```yaml
# vars/test_config.yml
meraki_config:
  organization:
    name: "TESTE-ORG"
  networks:
    - name: "TESTE-NET"
      product_types:
        - wireless
      ssids:
        - number: 0
          name: "TESTE-SSID"
          enabled: false
```

Execute:
```bash
ansible-playbook meraki_provision.yml \
  -e meraki_api_key="TEST_KEY" \
  -e @vars/test_config.yml \
  --check
```

## Trabalhando com a API

### Testando Endpoints

Use `curl` para testar endpoints antes de implementar:

```bash
# Listar organizações
curl -X GET "https://api.meraki.com/api/v1/organizations" \
  -H "X-Cisco-Meraki-API-Key: $MERAKI_API_KEY" | jq

# Criar rede (exemplo)
curl -X POST "https://api.meraki.com/api/v1/organizations/{org_id}/networks" \
  -H "X-Cisco-Meraki-API-Key: $MERAKI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "productTypes": ["wireless"]}'
```

### Documentação da API

Recursos úteis:
- [API v1 Documentation](https://developer.cisco.com/meraki/api-v1/)
- [Postman Collection](https://developer.cisco.com/meraki/api-v1/#!postman-collection)
- [API Changelog](https://developer.cisco.com/meraki/whats-new/)

## Fluxo de Desenvolvimento

### Workflow Git

```bash
# 1. Criar branch de feature
git checkout -b feature/nova-funcionalidade

# 2. Fazer alterações
# ... editar arquivos ...

# 3. Testar localmente
ansible-lint .
yamllint .
ansible-playbook ... --check

# 4. Commit
git add .
git commit -m "feat: adiciona suporte a VLANs"

# 5. Push
git push origin feature/nova-funcionalidade

# 6. Criar Pull Request
```

### Convenção de Commits

```
tipo(escopo): descrição

Tipos:
- feat: Nova funcionalidade
- fix: Correção de bug
- docs: Documentação
- refactor: Refatoração
- test: Testes
- chore: Manutenção

Exemplos:
feat(vlans): adiciona suporte a configuração de VLANs
fix(ssids): corrige validação de senha PSK
docs: atualiza guia de instalação
```

## Estrutura de Branches

```
main                    # Código estável/produção
├── develop             # Integração de features
├── feature/*           # Novas funcionalidades
├── fix/*               # Correções de bugs
└── release/*           # Preparação de releases
```

## Referências

### Documentação Oficial

- [Ansible Documentation](https://docs.ansible.com/)
- [Ansible Best Practices](https://docs.ansible.com/ansible/latest/tips_tricks/index.html)
- [YAML Specification](https://yaml.org/spec/1.2.2/)

### Recursos Adicionais

- [Meraki Developer Hub](https://developer.cisco.com/meraki/)
- [Ansible Galaxy](https://galaxy.ansible.com/)
- [Jinja2 Template Designer](https://jinja.palletsprojects.com/en/3.1.x/templates/)

## Próximos Passos

- Veja [Testes](testing.md) para estratégias de teste
- Consulte [Contribuição](contributing.md) para submeter alterações
