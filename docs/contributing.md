# Contribuição

Este documento descreve como contribuir com o projeto Meraki Ansible.

## Bem-vindo!

Agradecemos seu interesse em contribuir com o projeto! Toda contribuição é bem-vinda, seja ela:

- Correção de bugs
- Novas funcionalidades
- Melhorias na documentação
- Relatos de problemas
- Sugestões de melhorias

## Como Contribuir

### 1. Reportando Issues

#### Bugs

Ao reportar um bug, inclua:

```markdown
## Descrição do Bug

[Descrição clara do problema]

## Passos para Reproduzir

1. Executar comando X
2. Com configuração Y
3. Observar erro Z

## Comportamento Esperado

[O que deveria acontecer]

## Comportamento Atual

[O que está acontecendo]

## Ambiente

- OS: [ex: Ubuntu 22.04]
- Ansible: [ex: 2.14.0]
- Python: [ex: 3.10]

## Logs/Output
```

[Cole os logs relevantes aqui]

````

## Configuração (sem dados sensíveis)
```yaml
[Cole configuração relevante]
````

````

#### Feature Requests

```markdown
## Descrição da Funcionalidade
[O que você gostaria que fosse implementado]

## Caso de Uso
[Por que essa funcionalidade é útil]

## Proposta de Implementação (opcional)
[Como você imagina que poderia ser implementado]

## Alternativas Consideradas
[Outras abordagens que você considerou]
````

### 2. Contribuindo com Código

#### Fork e Clone

```bash
# 1. Fork o repositório no GitHub

# 2. Clone seu fork
git clone https://github.com/rodrigo-freitas-com/meraki-ansible.git
cd meraki-ansible

# 3. Adicione o upstream
git remote add upstream https://github.com/original/meraki-ansible.git

# 4. Mantenha seu fork atualizado
git fetch upstream
git checkout main
git merge upstream/main
```

#### Criando uma Branch

```bash
# Para features
git checkout -b feature/nome-da-feature

# Para correções
git checkout -b fix/descricao-do-fix

# Para documentação
git checkout -b docs/descricao
```

#### Fazendo Alterações

1. **Siga os padrões do projeto**
   - Veja [Guidelines](guidelines.md)
   - Use lint antes de commitar

2. **Escreva código limpo**

   ```yaml
   # ✅ Bom
   - name: Criar rede se não existir
     ansible.builtin.uri:
       url: "{{ meraki_base_url }}/organizations/{{ org_id }}/networks"
       method: POST
     when: network.name not in existing_networks

   # ❌ Ruim
   - uri:
       url: "{{ url }}"
       method: POST
   ```

3. **Adicione testes**
   - Teste suas alterações localmente
   - Adicione casos de teste se aplicável

4. **Atualize a documentação**
   - Se adicionar nova funcionalidade, documente
   - Atualize README se necessário

#### Commits

Siga o padrão de mensagens:

```bash
# Formato
tipo(escopo): descrição curta

# Tipos
feat:     Nova funcionalidade
fix:      Correção de bug
docs:     Documentação
style:    Formatação (não afeta código)
refactor: Refatoração
test:     Testes
chore:    Manutenção

# Exemplos
feat(vlans): adiciona suporte a configuração de VLANs
fix(ssids): corrige validação de senha PSK vazia
docs: adiciona exemplo de configuração multi-site
refactor(tasks): simplifica lógica de verificação de org
test: adiciona testes para criação de redes
chore: atualiza dependências
```

#### Pull Request

1. **Prepare seu PR**

   ```bash
   # Certifique-se que lint passa
   ansible-lint meraki_provision.yml
   yamllint .

   # Certifique-se que sintaxe está correta
   ansible-playbook meraki_provision.yml --syntax-check

   # Faça rebase se necessário
   git fetch upstream
   git rebase upstream/main
   ```

2. **Crie o PR**
   - Título claro e descritivo
   - Descrição do que foi alterado
   - Referência issues relacionadas

3. **Template de PR**

```markdown
## Descrição

[Descreva as mudanças realizadas]

## Tipo de Mudança

- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Checklist

- [ ] Li o guia de contribuição
- [ ] Meu código segue os padrões do projeto
- [ ] Lint passa sem erros
- [ ] Sintaxe está correta
- [ ] Testei minhas alterações
- [ ] Atualizei a documentação
- [ ] Adicionei testes (se aplicável)

## Issues Relacionadas

Fixes #123

## Screenshots (se aplicável)

[Adicione screenshots se relevante]
```

### 3. Revisão de Código

#### Como Revisar

1. **Checkout do PR**

   ```bash
   git fetch origin pull/123/head:pr-123
   git checkout pr-123
   ```

2. **Teste localmente**

   ```bash
   ansible-lint .
   ansible-playbook meraki_provision.yml --syntax-check
   ```

3. **Deixe feedback construtivo**
   - Seja respeitoso
   - Explique o "porquê"
   - Sugira alternativas

#### Critérios de Aprovação

- [ ] Código segue padrões do projeto
- [ ] Lint passa
- [ ] Sintaxe correta
- [ ] Testes passam (se aplicável)
- [ ] Documentação atualizada
- [ ] Não introduz vulnerabilidades
- [ ] Commits bem formatados

## Padrões do Projeto

### Estilo de Código

```yaml
# Indentação: 2 espaços
# Strings: aspas duplas para especiais, sem aspas para simples
# Booleanos: true/false
# Nomes: snake_case

# Exemplo
- name: Exemplo de task bem formatada
  ansible.builtin.uri:
    url: "{{ meraki_base_url }}/endpoint"
    method: GET
    headers:
      Content-Type: "application/json"
  register: result
  tags:
    - example
```

### Documentação

- Use Markdown
- Inclua exemplos de código
- Mantenha em português (docs/)
- Nomes de arquivos em inglês

### Testes

```bash
# Mínimo antes de PR
ansible-lint meraki_provision.yml
yamllint .
ansible-playbook meraki_provision.yml --syntax-check
```

## Código de Conduta

### Nossos Padrões

- Use linguagem acolhedora e inclusiva
- Respeite diferentes pontos de vista
- Aceite críticas construtivas graciosamente
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros

### Comportamentos Inaceitáveis

- Uso de linguagem ou imagens sexualizadas
- Trolling, insultos ou ataques pessoais
- Assédio público ou privado
- Publicar informações privadas de outros
- Outras condutas consideradas inapropriadas

### Aplicação

Instâncias de comportamento abusivo podem ser reportadas para [contato@rodrigo-freitas.com]. Todas as reclamações serão revisadas e investigadas.

## Reconhecimento

Contribuidores são reconhecidos:

- No arquivo CONTRIBUTORS.md
- Nas release notes
- Na documentação do projeto

## Dúvidas?

- Abra uma issue com a tag `question`
- Entre em contato: contato@rodrigo-freitas.com

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto.

---

Obrigado por contribuir com o Meraki Ansible!
