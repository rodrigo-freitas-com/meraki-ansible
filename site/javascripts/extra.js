/* JavaScript customizado para Meraki Ansible Docs */

// Aguardar carregamento do documento
document.addEventListener('DOMContentLoaded', function() {
  // Adicionar target="_blank" para links externos
  const links = document.querySelectorAll('a[href^="http"]');
  links.forEach(function(link) {
    if (!link.href.includes(window.location.hostname)) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });

  // Copiar código com feedback visual
  const codeBlocks = document.querySelectorAll('pre code');
  codeBlocks.forEach(function(codeBlock) {
    codeBlock.addEventListener('click', function() {
      // O Material for MkDocs já tem funcionalidade de copiar
      // Este é apenas um exemplo de extensão
    });
  });
});

// Console log para debug (remover em produção)
console.log('Meraki Ansible Docs loaded');
