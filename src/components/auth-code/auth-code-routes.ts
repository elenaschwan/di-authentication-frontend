import { PATH_NAMES } from "../../app.constants";

import * as express from "express";
import { validateSessionMiddleware } from "../../middleware/session-middleware";
import { authCodeGet } from "./auth-code-controller";
import { allowUserJourneyMiddleware } from "../../middleware/allow-user-journey-middleware";
import { asyncHandler } from "../../utils/async";

const router = express.Router();

router.get(
  PATH_NAMES.AUTH_CODE,
  validateSessionMiddleware,
  allowUserJourneyMiddleware,
  asyncHandler(authCodeGet())
);

export { router as authCodeRouter };
