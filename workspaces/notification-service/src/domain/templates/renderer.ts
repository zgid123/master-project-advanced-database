import Handlebars from 'handlebars';

export function renderTemplate(template: string | null | undefined, data: Record<string, unknown>): string {
  if (!template) return '';
  return Handlebars.compile(template, { noEscape: false })(data);
}
