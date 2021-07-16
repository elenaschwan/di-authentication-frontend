import request from "supertest";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";
import nock = require("nock");
import * as cheerio from "cheerio";
import * as sessionMiddleware from "../../../middleware/session-middleware";

describe("Integration:: resend mfa code", () => {
  let sandbox: sinon.SinonSandbox;
  let token: string | string[];
  let cookies: string;
  let app: any;
  let baseApi: string;

  before(() => {
    sandbox = sinon.createSandbox();
    sandbox
      .stub(sessionMiddleware, "validateSessionMiddleware")
      .callsFake(function (req: any, res: any, next: any): void {
        req.session.user = {
          id: "12sadjk",
          scope: "openid",
          email: "test@test.com",
          phoneNumber: "******7867",
        };
        next();
      });

    app = require("../../../app").createApp();
    baseApi = process.env.API_BASE_URL;

    request(app)
      .get("/resend-code")
      .end((err, res) => {
        const $ = cheerio.load(res.text);
        token = $("[name=_csrf]").val();
        cookies = res.headers["set-cookie"];
      });
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  after(() => {
    sandbox.restore();
    app = undefined;
  });

  it("should return resend mfda code page", (done) => {
    request(app).get("/resend-code").expect(200, done);
  });

  it("should return error when csrf not present", (done) => {
    request(app)
      .post("/resend-code")
      .type("form")
      .send({
        code: "123456",
      })
      .expect(500, done);
  });

  it("should redirect to /enter-code when new code requested", (done) => {
    nock(baseApi).post("/mfa").once().reply(200, {
      sessionState: "MFA_CODE_SENT",
    });

    request(app)
      .post("/resend-code")
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
      })
      .expect("Location", "/enter-code")
      .expect(302, done);
  });

  it("should return 500 error screen when API call fails", (done) => {
    nock(baseApi).post("/mfa").once().reply(500, {
      errorCode: "1234",
    });

    request(app)
      .post("/resend-code")
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
      })
      .expect(500, done);
  });
});
