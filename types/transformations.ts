import type { CleaningTransformType } from "./recommendations";

export type TransformationOperation = {
  type: CleaningTransformType;
  title: string;
  columns: string[];
  scannedCells: number;
  changedCells: number;
};

export type TransformationStep = {
  id: string;
  timestamp: string;
  stepType:
    | "upload"
    | "sample_selected"
    | "profile"
    | "ai_recommendation"
    | "user_acceptance"
    | "user_rejection"
    | "user_adjustment"
    | "join"
    | "cleaning"
    | "validation"
    | "dashboard_generation"
    | "export";
  description: string;
  inputs?: string[];
  outputs?: string[];
  affectedColumns?: string[];
  operations?: TransformationOperation[];
  assumptions?: string[];
};
