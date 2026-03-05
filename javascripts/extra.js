document.addEventListener('DOMContentLoaded', function() {
  const links = document.querySelectorAll('a[href^="http"]');
  links.forEach(function(link) {
    if (!link.href.includes(window.location.hostname)) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
  const codeBlocks = document.querySelectorAll('pre code');
  codeBlocks.forEach(function(codeBlock) {
    codeBlock.addEventListener('click', function() {
    });
  });
});

console.log('Meraki Ansible Docs loaded');
