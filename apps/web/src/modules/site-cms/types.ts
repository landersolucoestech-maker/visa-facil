export type CmsStatus = 'draft' | 'published' | 'scheduled' | 'hidden';
export type CmsFieldType = 'text' | 'textarea' | 'url' | 'image' | 'select' | 'repeater';
export type CmsRepeaterItem = Record<string, string | boolean>;
export type CmsValue = string | boolean | CmsRepeaterItem[];

export type CmsFieldDefinition = {
  id: string;
  label: string;
  type: CmsFieldType;
  defaultValue: CmsValue;
  help?: string;
  placeholder?: string;
  options?: string[];
  itemFields?: Array<Omit<CmsFieldDefinition, 'type' | 'defaultValue' | 'itemFields'> & { type: Exclude<CmsFieldType, 'repeater'> }>;
};

export type CmsSectionDefinition = {
  type: string;
  label: string;
  description: string;
  category: 'page' | 'global';
  fields: CmsFieldDefinition[];
};

export type CmsSectionInstance = {
  id: string;
  type: string;
  label: string;
  visible: boolean;
  order: number;
  values: Record<string, CmsValue>;
};

export type CmsSeo = {
  title: string;
  description: string;
  ogImage: string;
  canonicalUrl: string;
  noIndex: boolean;
};

export type CmsPage = {
  id: string;
  name: string;
  slug: string;
  status: CmsStatus;
  scheduledAt: string;
  updatedAt: string;
  seo: CmsSeo;
  sections: CmsSectionInstance[];
};

export type CmsMediaItem = {
  id: string;
  name: string;
  url: string;
  alt: string;
  kind: 'image' | 'document';
  createdAt: string;
};

export type CmsSettings = {
  siteName: string;
  siteUrl: string;
  locale: string;
  defaultOgImage: string;
  organizationName: string;
};

export type CmsDocument = {
  version: number;
  updatedAt: string;
  publishedAt: string | null;
  pages: CmsPage[];
  globals: CmsSectionInstance[];
  media: CmsMediaItem[];
  settings: CmsSettings;
};
