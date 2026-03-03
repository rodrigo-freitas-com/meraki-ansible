# Testes

Este documento descreve as estratégias e práticas de teste para o projeto Meraki Ansible.

## Visão Geral

O projeto utiliza múltiplas camadas de teste para garantir a qualidade e confiabilidade das automações.

### Pirâmide de Testes

```
        /\
       /  \  Testes E2E (Produção simulada)
      /----\
     /      \  Testes de Integração (API real)
    /--------\
   /          \  Testes Unitários (Sintaxe/Lint)
  /------------\
```

## Testes de Sintaxe

### Verificação de Sintaxe YAML

```bash
# Instalar yamllint
pip install yamllint

# Verificar todos os arquivos YAML
yamllint .

# Verificar arquivo específico
yamllint vars/meraki_config.yml

# Usar configuração customizada
yamllint -c .yamllint .
```

Configuração recomendada (`.yamllint`):

```yaml
extends: default
rules:
  line-length:
    max: 120
    level: warning
  truthy:
    allowed-values: ['true', 'false', 'yes', 'no']
  comments:
    min-spaces-from-content: 1
  indentation:
    spaces: 2
    indent-sequences: true
```

### Verificação de Sintaxe Ansible

```bash
# Verificar sintaxe do playbook
ansible-playbook meraki_provision.yml --syntax-check

# Verificar sintaxe com variáveis
ansible-playbook meraki_provision.yml \
  -e @vars/meraki_config.yml \
  --syntax-check
```

## Testes de Lint

### Ansible Lint

```bash
# Instalar ansible-lint
pip install ansible-lint

# Executar lint
ansible-lint meraki_provision.yml

# Lint em toda a role
ansible-lint roles/meraki_provisioning/

# Ignorar regras específicas
ansible-lint --skip-list yaml[truthy],no-changed-when

# Lint com perfil específico
ansible-lint --profile production
```

Configuração recomendada (`.ansible-lint`):

```yaml
profile: production
exclude_paths:
  - .git/
  - venv/
skip_list:
  - yaml[truthy]    # Permite yes/no
  - no-changed-when # Tasks de debug
warn_list:
  - experimental
```

### Regras Comuns

| Regra | Descrição | Ação |
|-------|-----------|------|
| `yaml[truthy]` | Uso de yes/no em vez de true/false | Padronizar booleanos |
| `no-changed-when` | Task sem changed_when | Adicionar quando apropriado |
| `name[missing]` | Task sem nome | Sempre nomear tasks |
| `risky-shell-pipe` | Pipe em shell sem set -o pipefail | Usar failed_when |

## Testes Unitários (Dry Run)

### Modo Check

O modo check simula a execução sem fazer alterações reais.

```bash
# Dry run básico
ansible-playbook meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e @vars/meraki_config.yml \
  --check

# Com diff (mostra mudanças)
ansible-playbook meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e @vars/meraki_config.yml \
  --check --diff
```

### Limitações do Modo Check

O modo check pode não funcionar completamente com o módulo `uri` pois:
- Requisições POST/PUT não são executadas
- Variáveis registradas ficam vazias
- Condicionais baseadas em resultados falham

**Solução**: Use tags para testar seções específicas.

## Testes por Tags

### Execução Seletiva

```bash
# Testar apenas organização
ansible-playbook meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e @vars/meraki_config.yml \
  --tags org

# Testar redes (inclui org como dependência)
ansible-playbook meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e @vars/meraki_config.yml \
  --tags networks

# Testar SSIDs
ansible-playbook meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e @vars/meraki_config.yml \
  --tags ssids

# Testar APs
ansible-playbook meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e @vars/meraki_config.yml \
  --tags aps
```

### Mapa de Tags

| Tag | Descrição | Dependências |
|-----|-----------|--------------|
| `org` | Organização | - |
| `always` | Executa sempre | - |
| `networks` | Criação de redes | org |
| `ssids` | Configuração de SSIDs | networks |
| `aps` | Claim de APs | org |
| `ap_config` | Configuração de APs | aps |
| `rf` | Perfis de RF | ap_config |

## Testes de Integração

### Ambiente de Teste

Recomenda-se criar uma organização de teste no Meraki Dashboard.

```yaml
# vars/test_config.yml
meraki_config:
  organization:
    name: "TESTE-AUTOMACAO"
    notes: "Organização para testes automatizados - NÃO USAR EM PRODUÇÃO"

  networks:
    - name: "TESTE-NET-001"
      product_types:
        - wireless
      tags:
        - teste
        - automacao
      ssids:
        - number: 0
          name: "TESTE-SSID"
          enabled: false  # Desabilitado por segurança
```

### Executando Testes de Integração

```bash
# Criar ambiente de teste
ansible-playbook meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e @vars/test_config.yml

# Verificar criação
curl -X GET "https://api.meraki.com/api/v1/organizations" \
  -H "X-Cisco-Meraki-API-Key: $MERAKI_API_KEY" | \
  jq '.[] | select(.name | contains("TESTE"))'

# Limpar ambiente (manual no Dashboard ou via API)
```

### Script de Teste Automatizado

```bash
#!/bin/bash
# test_integration.sh

set -e

echo "=== Iniciando testes de integração ==="

# Verificar variável de ambiente
if [ -z "$MERAKI_API_KEY" ]; then
  echo "Erro: MERAKI_API_KEY não definida"
  exit 1
fi

# Lint
echo ">>> Executando lint..."
ansible-lint meraki_provision.yml
yamllint vars/

# Sintaxe
echo ">>> Verificando sintaxe..."
ansible-playbook meraki_provision.yml --syntax-check

# Teste de organização
echo ">>> Testando criação de organização..."
ansible-playbook meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e @vars/test_config.yml \
  --tags org

# Teste de redes
echo ">>> Testando criação de redes..."
ansible-playbook meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e @vars/test_config.yml \
  --tags networks

echo "=== Testes concluídos com sucesso ==="
```

## Testes de Regressão

### Checklist de Regressão

Antes de cada release, verificar:

- [ ] Criação de organização funciona
- [ ] Organização existente é detectada (não duplica)
- [ ] Criação de redes funciona
- [ ] Redes existentes são detectadas
- [ ] SSIDs são configurados corretamente
- [ ] Claim de APs funciona
- [ ] Configuração de APs funciona
- [ ] Tags são aplicadas corretamente
- [ ] Validação de variáveis funciona
- [ ] Vault é descriptografado corretamente

### Teste de Idempotência

A idempotência é crucial - executar o playbook múltiplas vezes deve resultar no mesmo estado.

```bash
# Primeira execução
ansible-playbook meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e @vars/test_config.yml

# Segunda execução (deve ser idempotente)
ansible-playbook meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e @vars/test_config.yml

# Verificar que não houve mudanças na segunda execução
```

## Testes de Validação

### Validação de Configuração

```bash
# Verificar estrutura YAML
python3 -c "
import yaml
import sys

with open('vars/meraki_config.yml') as f:
    config = yaml.safe_load(f)

# Validações
assert 'meraki_config' in config, 'meraki_config não encontrado'
assert 'organization' in config['meraki_config'], 'organization não encontrado'
assert 'name' in config['meraki_config']['organization'], 'nome da org não encontrado'

print('Configuração válida!')
"
```

### Validação de Variáveis

```yaml
# Adicionar ao playbook para validação avançada
- name: Validar estrutura de configuração
  assert:
    that:
      - meraki_config is defined
      - meraki_config.organization is defined
      - meraki_config.organization.name is defined
      - meraki_config.organization.name | length > 0
      - meraki_config.networks is defined
      - meraki_config.networks | length > 0
    fail_msg: "Configuração inválida. Verifique o arquivo de variáveis."
    success_msg: "Configuração válida."
  tags:
    - validate
    - always
```

## Matriz de Testes

### Ambientes de Teste

| Ambiente | Organização | Propósito |
|----------|-------------|-----------|
| Dev | TESTE-DEV-* | Desenvolvimento local |
| CI/CD | TESTE-CI-* | Integração contínua |
| Staging | STAGING-* | Pré-produção |
| Produção | PROD-* | Ambiente real |

### Cenários de Teste

| Cenário | Descrição | Tags |
|---------|-----------|------|
| Org nova | Criar organização do zero | org |
| Org existente | Usar org existente | org |
| Rede nova | Criar rede em org existente | networks |
| SSID PSK | SSID com senha | ssids |
| SSID Open | SSID aberto | ssids |
| AP claim | Reivindicar novo AP | aps |
| AP config | Configurar AP existente | ap_config |
| Full | Fluxo completo | all |

## CI/CD Testing

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: |
          pip install ansible ansible-lint yamllint

      - name: YAML Lint
        run: yamllint .

      - name: Ansible Lint
        run: ansible-lint meraki_provision.yml

      - name: Syntax Check
        run: ansible-playbook meraki_provision.yml --syntax-check

  integration:
    needs: lint
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install Ansible
        run: pip install ansible

      - name: Run Integration Test
        env:
          MERAKI_API_KEY: ${{ secrets.MERAKI_API_KEY }}
        run: |
          ansible-playbook meraki_provision.yml \
            -e meraki_api_key=$MERAKI_API_KEY \
            -e @vars/test_config.yml \
            --tags org
```

## Relatórios de Teste

### Formato de Saída

```bash
# Saída em JSON
ansible-playbook meraki_provision.yml \
  -e @vars/test_config.yml \
  | tee test_output.log

# Callback para JSON
ANSIBLE_STDOUT_CALLBACK=json ansible-playbook meraki_provision.yml \
  -e @vars/test_config.yml > test_results.json
```

### Métricas de Teste

| Métrica | Descrição |
|---------|-----------|
| ok | Tasks executadas com sucesso |
| changed | Tasks que fizeram alterações |
| unreachable | Hosts inacessíveis |
| failed | Tasks que falharam |
| skipped | Tasks ignoradas |
| rescued | Tasks recuperadas |
| ignored | Erros ignorados |

## Próximos Passos

- Consulte [Deploy](deploy.md) para implantação em produção
- Veja [Contribuição](contributing.md) para submeter testes
