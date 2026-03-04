// Inicializacao do Mermaid para MkDocs
document.addEventListener('DOMContentLoaded', function() {
  mermaid.initialize({
    startOnLoad: true,
    theme: 'dark',
    securityLevel: 'loose',
    themeVariables: {
      primaryColor: '#1f77b4',
      primaryTextColor: '#ffffff',
      primaryBorderColor: '#ffffff',
      lineColor: '#ffffff',
      secondaryColor: '#2ca02c',
      tertiaryColor: '#333333',
      background: '#1e1e1e',
      mainBkg: '#2d2d2d',
      secondBkg: '#3d3d3d',
      border1: '#ffffff',
      border2: '#cccccc',
      arrowheadColor: '#ffffff',
      fontFamily: 'Roboto, sans-serif',
      fontSize: '14px',
      textColor: '#ffffff',
      nodeTextColor: '#ffffff',
      edgeLabelBackground: '#2d2d2d'
    },
    er: {
      useMaxWidth: true,
      entityPadding: 15,
      stroke: '#ffffff',
      fill: '#2d2d2d'
    },
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis'
    },
    sequence: {
      useMaxWidth: true,
      mirrorActors: false
    }
  });
});
