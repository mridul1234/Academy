import type { LeadSource, LeadStatus } from './types';

export const statusLabels: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  demo_scheduled: 'Demo Scheduled',
  demo_done: 'Demo Done',
  enrolled: 'Enrolled',
  lost: 'Lost',
};

export const statusOrder: LeadStatus[] = ['new', 'contacted', 'demo_scheduled', 'demo_done', 'enrolled', 'lost'];

export const sourceLabels: Record<LeadSource, string> = {
  unknown: "Don't know",
  facebook: 'Facebook',
  instagram: 'Instagram',
  google: 'Google',
  word_of_mouth: 'Word of Mouth',
  website: 'Website',
  other: 'Other',
};

export const planLabels: Record<string, string> = {
  buddy_beginner: 'Buddy Beginner',
  individual_beginner: 'Individual Beginner',
  buddy_intermediate: 'Buddy Intermediate',
  individual_intermediate: 'Individual Intermediate',
  buddy_advanced: 'Buddy Advanced',
  individual_advanced: 'Individual Advanced',
};

export const lostReasons = [
  'Price too high',
  'Timing mismatch',
  'Child not interested',
  'Enrolled elsewhere',
  'No response',
  'Other',
];

export const whatsappTemplate =
  'Hi {parent}, this is from ChessGum. Thanks for booking a free chess demo for {child}. What time works best for a quick call?';
