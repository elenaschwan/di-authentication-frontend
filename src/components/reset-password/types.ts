import { ApiResponseResult, DefaultApiResponse } from "../../types";

export interface ResetPasswordServiceInterface {
  updatePassword: (
    newPassword: string,
    sourceIp: string,
    sessionId: string,
    clientSessionId: string,
    persistentSessionId: string
  ) => Promise<ApiResponseResult<DefaultApiResponse>>;
}
