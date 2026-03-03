# Deploy

Este documento descreve os procedimentos para implantação do Meraki Ansible em ambientes de produção.

## Visão Geral do Deploy

O deploy do Meraki Ansible envolve a execução do playbook para provisionar recursos no Cisco Meraki Dashboard.

### Ambientes

| Ambiente | Propósito | Cuidados |
|----------|-----------|----------|
| Desenvolvimento | Testes locais | Org de teste |
| Homologação | Validação pré-prod | Config similar a prod |
| Produção | Ambiente real | Máxima atenção |

## Pré-Deploy Checklist

Antes de executar em produção, verifique:

### Configuração

- [ ] Arquivo de configuração revisado e aprovado
- [ ] Nomes de organização/redes corretos
- [ ] Seriais de APs validados
- [ ] Senhas de SSIDs são fortes
- [ ] Timezones corretos

### Credenciais

- [ ] API key válida e com permissões
- [ ] Vault criptografado
- [ ] Senha do vault disponível

### Validação

- [ ] Lint passou sem erros
- [ ] Sintaxe verificada
- [ ] Dry-run executado
- [ ] Testes em ambiente de homologação passaram

### Backup

- [ ] Configuração atual documentada
- [ ] Plano de rollback definido

## Procedimento de Deploy

### 1. Preparação

```bash
# Verificar branch correto
git status
git checkout main
git pull origin main

# Verificar configuração
cat vars/meraki_config.yml

# Verificar vault
ansible-vault view vars/vault.yml
```

### 2. Validação Final

```bash
# Lint
ansible-lint meraki_provision.yml

# Sintaxe
ansible-playbook meraki_provision.yml --syntax-check

# Listar tasks
ansible-playbook meraki_provision.yml --list-tasks

# Dry-run
ansible-playbook meraki_provision.yml \
  -e @vars/vault.yml \
  -e @vars/meraki_config.yml \
  --ask-vault-pass \
  --check
```

### 3. Execução

#### Deploy Completo

```bash
ansible-playbook meraki_provision.yml \
  -e @vars/vault.yml \
  -e @vars/meraki_config.yml \
  --ask-vault-pass
```

#### Deploy Incremental (por Tags)

```bash
# Apenas organização
ansible-playbook meraki_provision.yml \
  -e @vars/vault.yml \
  -e @vars/meraki_config.yml \
  --ask-vault-pass \
  --tags org

# Adicionar redes
ansible-playbook meraki_provision.yml \
  -e @vars/vault.yml \
  -e @vars/meraki_config.yml \
  --ask-vault-pass \
  --tags networks

# Configurar SSIDs
ansible-playbook meraki_provision.yml \
  -e @vars/vault.yml \
  -e @vars/meraki_config.yml \
  --ask-vault-pass \
  --tags ssids

# Provisionar APs
ansible-playbook meraki_provision.yml \
  -e @vars/vault.yml \
  -e @vars/meraki_config.yml \
  --ask-vault-pass \
  --tags aps
```

### 4. Verificação Pós-Deploy

```bash
# Via API
curl -X GET "https://api.meraki.com/api/v1/organizations" \
  -H "X-Cisco-Meraki-API-Key: $MERAKI_API_KEY" | jq

# Verificar redes
curl -X GET "https://api.meraki.com/api/v1/organizations/{org_id}/networks" \
  -H "X-Cisco-Meraki-API-Key: $MERAKI_API_KEY" | jq

# Via Dashboard
# Acessar dashboard.meraki.com e verificar:
# - Organização criada/atualizada
# - Redes presentes
# - SSIDs configurados
# - APs online
```

## Deploy Automatizado (CI/CD)

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Meraki

on:
  push:
    branches: [main]
    paths:
      - 'vars/meraki_config.yml'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'production'
        type: choice
        options:
          - staging
          - production
      tags:
        description: 'Tags to run (comma-separated or "all")'
        required: false
        default: 'all'

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || 'production' }}

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install Ansible
        run: pip install ansible

      - name: Validate
        run: |
          ansible-lint meraki_provision.yml
          ansible-playbook meraki_provision.yml --syntax-check

      - name: Deploy
        env:
          MERAKI_API_KEY: ${{ secrets.MERAKI_API_KEY }}
          VAULT_PASSWORD: ${{ secrets.VAULT_PASSWORD }}
        run: |
          echo "$VAULT_PASSWORD" > .vault_pass
          chmod 600 .vault_pass

          TAGS="${{ github.event.inputs.tags || 'all' }}"
          if [ "$TAGS" = "all" ]; then
            TAG_OPTION=""
          else
            TAG_OPTION="--tags $TAGS"
          fi

          ansible-playbook meraki_provision.yml \
            -e @vars/vault.yml \
            -e @vars/meraki_config.yml \
            --vault-password-file .vault_pass \
            $TAG_OPTION

          rm .vault_pass

      - name: Notify Success
        if: success()
        run: echo "Deploy completed successfully"

      - name: Notify Failure
        if: failure()
        run: echo "Deploy failed"
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - deploy

variables:
  ANSIBLE_FORCE_COLOR: "true"

validate:
  stage: validate
  image: python:3.10
  script:
    - pip install ansible ansible-lint yamllint
    - yamllint .
    - ansible-lint meraki_provision.yml
    - ansible-playbook meraki_provision.yml --syntax-check
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"

deploy_staging:
  stage: deploy
  image: python:3.10
  script:
    - pip install ansible
    - echo "$VAULT_PASSWORD" > .vault_pass
    - chmod 600 .vault_pass
    - ansible-playbook meraki_provision.yml
        -e @vars/vault.yml
        -e @vars/staging_config.yml
        --vault-password-file .vault_pass
    - rm .vault_pass
  environment:
    name: staging
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"
  when: manual

deploy_production:
  stage: deploy
  image: python:3.10
  script:
    - pip install ansible
    - echo "$VAULT_PASSWORD" > .vault_pass
    - chmod 600 .vault_pass
    - ansible-playbook meraki_provision.yml
        -e @vars/vault.yml
        -e @vars/meraki_config.yml
        --vault-password-file .vault_pass
    - rm .vault_pass
  environment:
    name: production
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  when: manual
```

## Estratégias de Deploy

### Deploy Canário

Aplicar mudanças em uma rede primeiro, validar, depois aplicar nas demais.

```bash
# 1. Deploy apenas na rede piloto
ansible-playbook meraki_provision.yml \
  -e @vars/vault.yml \
  -e @vars/piloto_config.yml \
  --ask-vault-pass

# 2. Validar no Dashboard

# 3. Deploy nas demais redes
ansible-playbook meraki_provision.yml \
  -e @vars/vault.yml \
  -e @vars/demais_config.yml \
  --ask-vault-pass
```

### Deploy Blue-Green

Não aplicável diretamente ao Meraki, mas pode-se:
1. Criar nova rede com nova configuração
2. Migrar dispositivos gradualmente
3. Desativar rede antiga

### Rolling Deploy

Para múltiplas localidades:

```bash
# Deploy por localidade
for config in vars/site_*.yml; do
  echo "Deploying: $config"
  ansible-playbook meraki_provision.yml \
    -e @vars/vault.yml \
    -e @$config \
    --ask-vault-pass
  sleep 30  # Intervalo entre sites
done
```

## Rollback

### Procedimento de Rollback

1. **Identificar problema**
   - Verificar logs do Ansible
   - Verificar Dashboard Meraki
   - Identificar tasks que falharam

2. **Reverter configuração**
   ```bash
   # Usar arquivo de configuração anterior
   git checkout HEAD~1 -- vars/meraki_config.yml

   # Re-executar playbook
   ansible-playbook meraki_provision.yml \
     -e @vars/vault.yml \
     -e @vars/meraki_config.yml \
     --ask-vault-pass
   ```

3. **Rollback manual** (se necessário)
   - Acessar Dashboard Meraki
   - Reverter configurações manualmente
   - Documentar mudanças

### Backup de Configuração

```bash
# Exportar configuração atual via API
curl -X GET "https://api.meraki.com/api/v1/organizations/{org_id}/networks" \
  -H "X-Cisco-Meraki-API-Key: $MERAKI_API_KEY" \
  > backup/networks_$(date +%Y%m%d).json

curl -X GET "https://api.meraki.com/api/v1/networks/{network_id}/wireless/ssids" \
  -H "X-Cisco-Meraki-API-Key: $MERAKI_API_KEY" \
  > backup/ssids_$(date +%Y%m%d).json
```

## Monitoramento Pós-Deploy

### Verificações Imediatas

```bash
# Verificar status dos APs
curl -X GET "https://api.meraki.com/api/v1/organizations/{org_id}/devices/statuses" \
  -H "X-Cisco-Meraki-API-Key: $MERAKI_API_KEY" | \
  jq '.[] | select(.status != "online")'

# Verificar alertas
curl -X GET "https://api.meraki.com/api/v1/organizations/{org_id}/assurance/alerts" \
  -H "X-Cisco-Meraki-API-Key: $MERAKI_API_KEY"
```

### Dashboard Meraki

Verificar no Dashboard:
- Organization > Monitor > Overview
- Network-wide > Monitor > Clients
- Wireless > Monitor > Access points

### Alertas

Configurar alertas no Meraki Dashboard:
- Network-wide > Configure > Alerts
- Definir destinatários de e-mail
- Configurar webhooks se necessário

## Troubleshooting de Deploy

### Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| 401 Unauthorized | API key inválida | Verificar/renovar API key |
| 403 Forbidden | Sem permissão | Verificar permissões da API key |
| 404 Not Found | Recurso não existe | Verificar IDs |
| 429 Rate Limited | Muitas requisições | Aguardar e tentar novamente |
| 400 Bad Request | Payload inválido | Verificar dados de entrada |

### Debug de Falhas

```bash
# Executar com verbosidade máxima
ansible-playbook meraki_provision.yml \
  -e @vars/vault.yml \
  -e @vars/meraki_config.yml \
  --ask-vault-pass \
  -vvv 2>&1 | tee deploy_debug.log

# Analisar log
grep -E "FAILED|ERROR|fatal" deploy_debug.log
```

### Reexecutar Tasks Específicas

```bash
# Executar apenas tasks com tag específica
ansible-playbook meraki_provision.yml \
  -e @vars/vault.yml \
  -e @vars/meraki_config.yml \
  --ask-vault-pass \
  --tags "ssids"

# Iniciar a partir de task específica
ansible-playbook meraki_provision.yml \
  -e @vars/vault.yml \
  -e @vars/meraki_config.yml \
  --ask-vault-pass \
  --start-at-task "Configurar SSIDs"
```

## Documentação de Deploy

### Template de Registro

```markdown
## Deploy - [DATA]

**Ambiente**: Produção
**Versão**: v1.2.0
**Executor**: [Nome]

### Configuração Aplicada
- Organização: [Nome]
- Redes: [Lista]
- APs: [Quantidade]

### Resultado
- [ ] Sucesso
- [ ] Falha parcial
- [ ] Falha total

### Observações
[Anotações relevantes]

### Próximos Passos
[Se aplicável]
```

## Próximos Passos

- Consulte [Contribuição](contributing.md) para submeter melhorias
- Veja [Release Notes](release-notes.md) para histórico de versões
