export type ChannelCode = 'in_app' | 'email' | 'web_push' | 'mobile_push' | 'sms';

export type CategoryRow = {
  id: number;
  code: string;
  display_name: string;
  default_channels: number[];
  importance: number;
  is_transactional: boolean;
};

export type ChannelRow = {
  id: number;
  code: ChannelCode;
  display_name: string;
};

export type TemplateRow = {
  id: string;
  category_id: number;
  channel_id: number;
  locale: string;
  subject: string | null;
  body: string;
  body_html: string | null;
};
