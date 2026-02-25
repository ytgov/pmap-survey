export interface Setting {
  ID: number;
  SID?: number;
  QID?: number;
  KEY: string;
  VALUE?: string;
}

export interface Setting_Create {
  SID?: number;
  QID?: number;
  KEY: string;
  VALUE?: string;
}

export interface Setting_Update {
  SID?: number;
  QID?: number;
  KEY?: string;
  VALUE?: string;
}
