// src/types/model.ts
export type DeployModelResponse = {
  status: string; // "success"
  message: string; // "Model updated to version v1.1.0"
  version: string; // "v1.1.0"
  deployedAt: string; // ISO datetime
};

export type DeployModelArgs = {
  version: string; // path param
};

// 재로드 응답 타입
export type ReloadModelResponse = {
  status: string; // "success"
  message: string; // "Model reload request sent successfully"
  requestedAt: string; // ISO datetime
};
