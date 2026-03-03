# Autenticação e Segurança

Este documento detalha os mecanismos de autenticação e as práticas de segurança implementadas no projeto Meraki Ansible.

## Visão Geral de Segurança

O projeto implementa múltiplas camadas de segurança para proteger credenciais e garantir acesso autorizado aos recursos Meraki.

### Princípios de Segurança

1. **Mínimo Privilégio**: Usar API keys com permissões específicas
2. **Defesa em Profundidade**: Múltiplas camadas de proteção
3. **Criptografia**: Credenciais sempre criptografadas em repouso
4. **Auditoria**: Rastreamento de operações via logs

## Autenticação com API Meraki

### API Key

A autenticação com a API Meraki é feita via API Key no header HTTP.

```http
X-Cisco-Meraki-API-Key: {sua_api_key}
```

### Obtenção da API Key

1. Acesse o [Meraki Dashboard](https://dashboard.meraki.com)
2. Navegue até **Organization > Settings**
3. Habilite **Dashboard API access**
4. Vá para seu perfil (**My Profile**)
5. Em **API access**, clique em **Generate new API key**
6. Copie e armazene a chave de forma segura

> **Atenção**: A API key é exibida apenas uma vez. Não é possível recuperá-la posteriormente.

### Permissões da API Key

| Nível | Descrição | Operações Permitidas |
|-------|-----------|---------------------|
| Full Organization Admin | Acesso total | Todas as operações |
| Read-only Admin | Apenas leitura | GET em todos endpoints |
| Network Admin | Admin de rede | Operações em redes específicas |

**Recomendação**: Use o nível mínimo necessário para as operações.

## Métodos de Autenticação

### Método 1: Variável de Ambiente

O método mais simples para ambientes de desenvolvimento.

```bash
# Definir variável de ambiente
export MERAKI_API_KEY="sua_api_key_aqui"

# Executar playbook
ansible-playbook meraki_provision.yml \
  -e meraki_api_key=$MERAKI_API_KEY \
  -e @vars/meraki_config.yml
```

**Vantagens**:
- Simples de configurar
- API key não fica no código

**Desvantagens**:
- Visível no histórico do shell
- Não recomendado para CI/CD

### Método 2: Ansible Vault (Recomendado)

O método mais seguro para ambientes de produção.

#### Configuração Inicial

```bash
# Criar arquivo vault com a API key
cat > vars/vault.yml << 'EOF'
vault_meraki_api_key: "sua_api_key_secreta"
EOF

# Criptografar o arquivo
ansible-vault encrypt vars/vault.yml
# Digite e confirme uma senha forte
```

#### Execução com Vault

```bash
# Método interativo (solicita senha)
ansible-playbook meraki_provision.yml \
  -e @vars/vault.yml \
  -e @vars/meraki_config.yml \
  --ask-vault-pass

# Método com arquivo de senha
ansible-playbook meraki_provision.yml \
  -e @vars/vault.yml \
  -e @vars/meraki_config.yml \
  --vault-password-file ~/.vault_pass
```

#### Gerenciamento do Vault

```bash
# Visualizar conteúdo (requer senha)
ansible-vault view vars/vault.yml

# Editar conteúdo (requer senha)
ansible-vault edit vars/vault.yml

# Alterar senha do vault
ansible-vault rekey vars/vault.yml

# Descriptografar (não recomendado em produção)
ansible-vault decrypt vars/vault.yml
```

**Vantagens**:
- Criptografia AES-256
- Seguro para versionamento
- Integração nativa com Ansible

**Desvantagens**:
- Requer gerenciamento de senha do vault
- Complexidade adicional

### Método 3: Arquivo de Senha do Vault

Para automação em CI/CD.

```bash
# Criar arquivo de senha (600 permissions)
echo "senha_do_vault" > ~/.vault_pass
chmod 600 ~/.vault_pass

# Configurar no ansible.cfg
[defaults]
vault_password_file = ~/.vault_pass

# Ou via variável de ambiente
export ANSIBLE_VAULT_PASSWORD_FILE=~/.vault_pass
```

**Segurança adicional para CI/CD**:
```bash
# GitHub Actions
- name: Run Ansible
  env:
    ANSIBLE_VAULT_PASSWORD: ${{ secrets.VAULT_PASSWORD }}
  run: |
    echo "$ANSIBLE_VAULT_PASSWORD" > .vault_pass
    ansible-playbook ... --vault-password-file .vault_pass
    rm .vault_pass
```

## Segurança de Senhas SSID

### Requisitos de Senha

Para SSIDs com autenticação PSK:

| Requisito | Mínimo | Recomendado |
|-----------|--------|-------------|
| Comprimento | 8 caracteres | 16+ caracteres |
| Complexidade | Alfanumérico | Alfanumérico + especiais |

### Boas Práticas

```yaml
# ✅ Senha forte
ssids:
  - name: "Empresa-Corp"
    auth_mode: "psk"
    psk: "S3nh@Segur@2024!Pr0duc@o"

# ❌ Senha fraca (não usar)
ssids:
  - name: "Empresa-Corp"
    auth_mode: "psk"
    psk: "12345678"
```

### Rotação de Senhas

Recomenda-se rotacionar senhas SSID periodicamente:

1. Atualizar senha no arquivo de configuração
2. Executar playbook com tag `ssids`
3. Comunicar usuários sobre a mudança
4. Monitorar conexões com a nova senha

```bash
# Atualizar apenas SSIDs
ansible-playbook meraki_provision.yml \
  -e @vars/vault.yml \
  -e @vars/meraki_config.yml \
  --tags ssids
```

## Proteção de Arquivos

### Permissões de Arquivo

```bash
# Arquivos sensíveis - apenas proprietário
chmod 600 vars/vault.yml
chmod 600 ~/.vault_pass

# Arquivos de configuração - leitura para grupo
chmod 640 vars/meraki_config.yml

# Playbooks e roles - execução
chmod 755 meraki_provision.yml
```

### .gitignore

Sempre inclua no `.gitignore`:

```gitignore
# Credenciais
vars/vault.yml
*.vault
.vault_pass
~/.vault_pass

# Ambientes
.env
.env.*
*.env

# Chaves
*.pem
*.key
*.crt

# Arquivos temporários
*.retry
*.pyc
__pycache__/

# Logs com possíveis credenciais
*.log
```

## Validação de Segurança

### Pre-tasks de Validação

O playbook inclui validações de segurança:

```yaml
pre_tasks:
  - name: Validar API Key
    assert:
      that:
        - meraki_api_key is defined
        - meraki_api_key | length > 0
        - meraki_api_key != "sua_api_key_aqui"
      fail_msg: "API Key inválida ou não definida"

  - name: Validar configuração
    assert:
      that:
        - meraki_config is defined
        - meraki_config.organization is defined
      fail_msg: "Configuração incompleta"
```

### Verificação de Credenciais Expostas

Antes de commits, verifique:

```bash
# Buscar por possíveis API keys expostas
grep -r "X-Cisco-Meraki-API-Key" --include="*.yml" .
grep -r "meraki_api_key:" --include="*.yml" .

# Verificar se vault está criptografado
head -1 vars/vault.yml
# Deve mostrar: $ANSIBLE_VAULT;1.1;AES256
```

## Auditoria e Logging

### Logs do Ansible

```bash
# Habilitar logging
export ANSIBLE_LOG_PATH=./ansible.log

# Executar com verbosidade
ansible-playbook meraki_provision.yml -vvv 2>&1 | tee execution.log
```

### Logs da API Meraki

A API Meraki mantém logs de todas as operações. Acesse via:

1. Dashboard > Organization > Change log
2. API: `GET /organizations/{id}/apiRequests`

### Informações Logadas

| Campo | Descrição |
|-------|-----------|
| Timestamp | Data/hora da operação |
| Admin | Usuário que realizou |
| Action | Tipo de operação |
| Target | Recurso afetado |
| Details | Detalhes da mudança |

## Rotação de Credenciais

### Rotação de API Key

1. Gere nova API key no Dashboard
2. Atualize o vault:
   ```bash
   ansible-vault edit vars/vault.yml
   # Altere vault_meraki_api_key
   ```
3. Teste a nova key
4. Revogue a key antiga no Dashboard

### Rotação de Senha do Vault

```bash
# Alterar senha do vault
ansible-vault rekey vars/vault.yml
# Digite senha atual
# Digite nova senha
# Confirme nova senha

# Atualizar em sistemas automatizados
echo "nova_senha" > ~/.vault_pass
chmod 600 ~/.vault_pass
```

## Segurança em CI/CD

### GitHub Actions

```yaml
name: Deploy Meraki

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install Ansible
        run: pip install ansible

      - name: Run Playbook
        env:
          MERAKI_API_KEY: ${{ secrets.MERAKI_API_KEY }}
        run: |
          ansible-playbook meraki_provision.yml \
            -e meraki_api_key=$MERAKI_API_KEY \
            -e @vars/meraki_config.yml
```

### GitLab CI

```yaml
deploy:
  stage: deploy
  script:
    - pip install ansible
    - echo "$VAULT_PASSWORD" > .vault_pass
    - chmod 600 .vault_pass
    - ansible-playbook meraki_provision.yml
        -e @vars/vault.yml
        -e @vars/meraki_config.yml
        --vault-password-file .vault_pass
    - rm .vault_pass
  only:
    - main
```

## Checklist de Segurança

Antes de executar em produção:

- [ ] API key armazenada no vault (não em texto plano)
- [ ] Vault criptografado (`$ANSIBLE_VAULT;1.1;AES256`)
- [ ] Arquivo vault.yml no .gitignore
- [ ] Permissões corretas em arquivos sensíveis (600)
- [ ] Senhas SSID são fortes (16+ caracteres)
- [ ] Nenhuma credencial nos logs
- [ ] API key com permissões mínimas necessárias

## Resposta a Incidentes

### Em Caso de Credencial Exposta

1. **Imediatamente**: Revogue a API key no Dashboard
2. Gere nova API key
3. Atualize o vault
4. Investigue o escopo do vazamento
5. Revise logs da API Meraki
6. Documente o incidente

### Comandos de Emergência

```bash
# Verificar últimas requisições da API
# (via Dashboard ou API)
curl -X GET \
  "https://api.meraki.com/api/v1/organizations/{org_id}/apiRequests" \
  -H "X-Cisco-Meraki-API-Key: $MERAKI_API_KEY"
```

## Próximos Passos

- Veja [Desenvolvimento](development.md) para práticas de desenvolvimento seguro
- Consulte [Deploy](deploy.md) para implantação segura em produção
