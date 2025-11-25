/**
 * Type definitions for template data structures.
 */

export interface StudyCriteria {
  name: string;
  description: string;
  weight: number;
  unit: string;
  higherIsBetter: boolean;
}

export interface StudyTemplate {
  id: string;
  name: string;
  description: string;
  componentType: string;
  criteria: StudyCriteria[];
  icon: string;
}

export interface TemplateComponent {
  manufacturer: string;
  partNumber: string;
  description?: string;
  availability?: "in_stock" | "limited" | "obsolete";
}

export interface ProjectTemplateStudy {
  name: string;
  componentType: string;
  description: string;
  criteria: StudyCriteria[];
  components: TemplateComponent[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  color: string;
  studies: ProjectTemplateStudy[];
  icon: string;
}

