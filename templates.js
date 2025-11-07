// Empleaido Templates for Tab Grouper
// Pre-configured workspace templates for common workflows

export const TEMPLATES = {
  Docs: [{
    title: '📑 Docs',
    color: 'yellow',
    tabs: [
      { url: 'https://notion.so' },
      { url: 'https://drive.google.com' },
      { url: 'https://docs.google.com' }
    ]
  }],

  AI: [{
    title: '🤖 AI',
    color: 'purple',
    tabs: [
      { url: 'https://chat.openai.com' },
      { url: 'https://claude.ai' },
      { url: 'https://gemini.google.com' }
    ]
  }],

  Code: [{
    title: '💻 Code',
    color: 'cyan',
    tabs: [
      { url: 'https://github.com' },
      { url: 'https://cursor.sh' },
      { url: 'https://stackblitz.com' }
    ]
  }],

  Social: [{
    title: '📱 Social',
    color: 'green',
    tabs: [
      { url: 'https://twitter.com' },
      { url: 'https://www.reddit.com' },
      { url: 'https://www.youtube.com' }
    ]
  }],

  // Empleaido Super Workspace
  Empleaido: [
    {
      title: '📑 Docs',
      color: 'yellow',
      tabs: [
        { url: 'https://notion.so' },
        { url: 'https://docs.google.com' }
      ]
    },
    {
      title: '🤖 AI',
      color: 'purple',
      tabs: [
        { url: 'https://chat.openai.com' },
        { url: 'https://claude.ai' }
      ]
    },
    {
      title: '💻 Code',
      color: 'cyan',
      tabs: [
        { url: 'https://github.com' },
        { url: 'https://cursor.sh' }
      ]
    },
    {
      title: '📱 Social',
      color: 'green',
      tabs: [
        { url: 'https://twitter.com' },
        { url: 'https://linkedin.com' }
      ]
    }
  ]
};

// Get all template names
export function getTemplateNames() {
  return Object.keys(TEMPLATES);
}

// Get template by name
export function getTemplate(name) {
  return TEMPLATES[name] || null;
}
