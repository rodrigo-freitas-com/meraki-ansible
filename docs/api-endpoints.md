# API Endpoints

Este documento detalha todos os endpoints da API Cisco Meraki utilizados pelo projeto.

## Visão Geral

O projeto utiliza a **Meraki Dashboard API v1** para todas as operações de provisionamento.

### URL Base

```
https://api.meraki.com/api/v1
```

### Autenticação

Todas as requisições utilizam autenticação via header:

```http
X-Cisco-Meraki-API-Key: {api_key}
```

### Headers Padrão

```http
Content-Type: application/json
X-Cisco-Meraki-API-Key: {api_key}
```

## Endpoints de Organização

### Listar Organizações

Retorna todas as organizações acessíveis pela API key.

```http
GET /organizations
```

**Resposta de Sucesso (200)**:
```json
[
  {
    "id": "123456",
    "name": "Empresa ABC",
    "url": "https://dashboard.meraki.com/o/xxx/manage/organization/overview",
    "api": {
      "enabled": true
    },
    "licensing": {
      "model": "co-term"
    }
  }
]
```

**Uso no Projeto**:
```yaml
- name: Listar organizações existentes
  ansible.builtin.uri:
    url: "{{ meraki_base_url }}/organizations"
    method: GET
    headers:
      X-Cisco-Meraki-API-Key: "{{ meraki_api_key }}"
    status_code: 200
  register: existing_orgs
```

### Criar Organização

Cria uma nova organização.

```http
POST /organizations
```

**Request Body**:
```json
{
  "name": "Nome da Organização"
}
```

**Resposta de Sucesso (201)**:
```json
{
  "id": "123456",
  "name": "Nome da Organização",
  "url": "https://dashboard.meraki.com/o/xxx/manage/organization/overview"
}
```

**Uso no Projeto**:
```yaml
- name: Criar organização
  ansible.builtin.uri:
    url: "{{ meraki_base_url }}/organizations"
    method: POST
    headers:
      X-Cisco-Meraki-API-Key: "{{ meraki_api_key }}"
      Content-Type: "application/json"
    body_format: json
    body:
      name: "{{ meraki_config.organization.name }}"
    status_code: 201
  register: created_org
```

## Endpoints de Redes

### Listar Redes da Organização

Retorna todas as redes de uma organização.

```http
GET /organizations/{organizationId}/networks
```

**Parâmetros de Path**:

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| organizationId | string | ID da organização |

**Resposta de Sucesso (200)**:
```json
[
  {
    "id": "N_123456",
    "organizationId": "123456",
    "name": "SEDE-SP",
    "productTypes": ["wireless"],
    "timeZone": "America/Sao_Paulo",
    "tags": ["producao", "sede"],
    "notes": "Rede principal"
  }
]
```

**Uso no Projeto**:
```yaml
- name: Listar redes existentes
  ansible.builtin.uri:
    url: "{{ meraki_base_url }}/organizations/{{ org_id }}/networks"
    method: GET
    headers:
      X-Cisco-Meraki-API-Key: "{{ meraki_api_key }}"
    status_code: 200
  register: existing_networks_response
```

### Criar Rede

Cria uma nova rede na organização.

```http
POST /organizations/{organizationId}/networks
```

**Request Body**:
```json
{
  "name": "SEDE-SP",
  "productTypes": ["wireless", "switch", "appliance"],
  "timeZone": "America/Sao_Paulo",
  "tags": ["producao"],
  "notes": "Rede da sede"
}
```

**Resposta de Sucesso (201)**:
```json
{
  "id": "N_123456",
  "organizationId": "123456",
  "name": "SEDE-SP",
  "productTypes": ["wireless", "switch", "appliance"],
  "timeZone": "America/Sao_Paulo",
  "tags": ["producao"],
  "notes": "Rede da sede"
}
```

**Uso no Projeto**:
```yaml
- name: Criar rede
  ansible.builtin.uri:
    url: "{{ meraki_base_url }}/organizations/{{ org_id }}/networks"
    method: POST
    headers:
      X-Cisco-Meraki-API-Key: "{{ meraki_api_key }}"
      Content-Type: "application/json"
    body_format: json
    body:
      name: "{{ network.name }}"
      productTypes: "{{ network.product_types }}"
      timeZone: "{{ network.timezone | default('America/Sao_Paulo') }}"
      tags: "{{ network.tags | default([]) }}"
      notes: "{{ network.notes | default('') }}"
    status_code: 201
  register: created_network
```

## Endpoints de SSIDs

### Configurar SSID

Atualiza a configuração de um SSID específico.

```http
PUT /networks/{networkId}/wireless/ssids/{number}
```

**Parâmetros de Path**:

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| networkId | string | ID da rede |
| number | integer | Número do SSID (0-14) |

**Request Body**:
```json
{
  "name": "Empresa-Corp",
  "enabled": true,
  "authMode": "psk",
  "encryptionMode": "wpa",
  "wpaEncryptionMode": "WPA2 only",
  "psk": "senhasegura123",
  "ipAssignmentMode": "Bridge mode",
  "defaultVlanId": 100
}
```

**Parâmetros do Body**:

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| name | string | Sim | Nome do SSID |
| enabled | boolean | Sim | SSID ativo |
| authMode | string | Não | Modo de autenticação |
| encryptionMode | string | Não | Modo de criptografia |
| wpaEncryptionMode | string | Não | Versão WPA |
| psk | string | Condicional | Senha (se authMode=psk) |
| ipAssignmentMode | string | Não | Modo de IP |
| defaultVlanId | integer | Não | VLAN padrão |

**Resposta de Sucesso (200)**:
```json
{
  "number": 0,
  "name": "Empresa-Corp",
  "enabled": true,
  "authMode": "psk",
  "encryptionMode": "wpa",
  "wpaEncryptionMode": "WPA2 only",
  "ipAssignmentMode": "Bridge mode",
  "defaultVlanId": 100
}
```

**Uso no Projeto**:
```yaml
- name: Configurar SSID
  ansible.builtin.uri:
    url: "{{ meraki_base_url }}/networks/{{ network_id }}/wireless/ssids/{{ ssid.number }}"
    method: PUT
    headers:
      X-Cisco-Meraki-API-Key: "{{ meraki_api_key }}"
      Content-Type: "application/json"
    body_format: json
    body:
      name: "{{ ssid.name }}"
      enabled: "{{ ssid.enabled }}"
      authMode: "{{ ssid.auth_mode | default('open') }}"
    status_code: 200
```

## Endpoints de Dispositivos

### Claim de Dispositivos na Organização

Reivindica dispositivos para a organização.

```http
POST /organizations/{organizationId}/inventory/claim
```

**Request Body**:
```json
{
  "serials": ["Q2AB-1234-ABCD", "Q2AB-5678-EFGH"]
}
```

**Resposta de Sucesso (200)**:
```json
{
  "serials": ["Q2AB-1234-ABCD", "Q2AB-5678-EFGH"]
}
```

**Uso no Projeto**:
```yaml
- name: Claim APs na organização
  ansible.builtin.uri:
    url: "{{ meraki_base_url }}/organizations/{{ org_id }}/inventory/claim"
    method: POST
    headers:
      X-Cisco-Meraki-API-Key: "{{ meraki_api_key }}"
      Content-Type: "application/json"
    body_format: json
    body:
      serials: "{{ all_ap_serials }}"
    status_code: 200
  register: claimed_aps
```

### Adicionar Dispositivo à Rede

Adiciona dispositivos já reivindicados a uma rede específica.

```http
POST /networks/{networkId}/devices/claim
```

**Request Body**:
```json
{
  "serials": ["Q2AB-1234-ABCD"]
}
```

**Resposta de Sucesso (200)**:
```json
{
  "serials": ["Q2AB-1234-ABCD"]
}
```

**Uso no Projeto**:
```yaml
- name: Adicionar AP à rede
  ansible.builtin.uri:
    url: "{{ meraki_base_url }}/networks/{{ network_id }}/devices/claim"
    method: POST
    headers:
      X-Cisco-Meraki-API-Key: "{{ meraki_api_key }}"
      Content-Type: "application/json"
    body_format: json
    body:
      serials: "{{ ap_serials }}"
    status_code: 200
```

### Atualizar Dispositivo

Atualiza configurações de um dispositivo específico.

```http
PUT /devices/{serial}
```

**Parâmetros de Path**:

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| serial | string | Número de série do dispositivo |

**Request Body**:
```json
{
  "name": "AP-RECEPCAO",
  "tags": ["recepcao", "andar1"],
  "lat": -23.550520,
  "lng": -46.633308,
  "address": "Av. Paulista, 1000 - São Paulo, SP",
  "notes": "AP da recepção principal"
}
```

**Resposta de Sucesso (200)**:
```json
{
  "serial": "Q2AB-1234-ABCD",
  "name": "AP-RECEPCAO",
  "mac": "00:18:0a:xx:xx:xx",
  "networkId": "N_123456",
  "model": "MR46",
  "tags": ["recepcao", "andar1"],
  "lat": -23.550520,
  "lng": -46.633308,
  "address": "Av. Paulista, 1000 - São Paulo, SP",
  "notes": "AP da recepção principal"
}
```

**Uso no Projeto**:
```yaml
- name: Configurar AP
  ansible.builtin.uri:
    url: "{{ meraki_base_url }}/devices/{{ ap.serial }}"
    method: PUT
    headers:
      X-Cisco-Meraki-API-Key: "{{ meraki_api_key }}"
      Content-Type: "application/json"
    body_format: json
    body:
      name: "{{ ap.name }}"
      tags: "{{ ap.tags | default([]) }}"
      lat: "{{ ap.lat | default(omit) }}"
      lng: "{{ ap.lng | default(omit) }}"
      address: "{{ ap.address | default(omit) }}"
      notes: "{{ ap.notes | default('') }}"
    status_code: 200
```

### Configurar Rádio do AP

Configura as configurações de rádio (RF) do Access Point.

```http
PUT /devices/{serial}/wireless/radio/settings
```

**Request Body**:
```json
{
  "rfProfileId": "123456"
}
```

**Resposta de Sucesso (200)**:
```json
{
  "serial": "Q2AB-1234-ABCD",
  "rfProfileId": "123456"
}
```

## Códigos de Status HTTP

| Código | Descrição | Ação |
|--------|-----------|------|
| 200 | Sucesso (GET, PUT) | Operação concluída |
| 201 | Criado (POST) | Recurso criado com sucesso |
| 400 | Bad Request | Verificar parâmetros |
| 401 | Não autorizado | Verificar API key |
| 403 | Proibido | Verificar permissões |
| 404 | Não encontrado | Verificar IDs |
| 429 | Rate limit | Aguardar e tentar novamente |
| 500 | Erro interno | Contatar suporte Meraki |

## Rate Limiting

A API Meraki possui limites de requisições:

| Tipo | Limite |
|------|--------|
| Dashboard API | 10 requisições/segundo |
| Burst | 5 requisições instantâneas |

**Tratamento no Ansible**:
```yaml
- name: Operação com retry
  ansible.builtin.uri:
    url: "{{ meraki_base_url }}/..."
  retries: 3
  delay: 5
  until: result is succeeded
```

## Referências

- [Documentação Oficial da API Meraki](https://developer.cisco.com/meraki/api-v1/)
- [Postman Collection](https://developer.cisco.com/meraki/api-v1/#!postman-collection)
- [API Changelog](https://developer.cisco.com/meraki/whats-new/)

## Próximos Passos

- Veja [Modelagem do Sistema](system-modeling.md) para diagramas de fluxo
- Consulte [Autenticação e Segurança](authentication.md) para boas práticas
