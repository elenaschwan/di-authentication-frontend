import request from "supertest";
import { describe } from "mocha";
import { expect, sinon } from "../../../../test/utils/test-utils";
import nock = require("nock");
import * as cheerio from "cheerio";
import decache from "decache";
import { PATH_NAMES } from "../../../app.constants";

describe("Integration:: contact us - public user", () => {
  let sandbox: sinon.SinonSandbox;
  let token: string | string[];
  let cookies: string;
  let app: any;
  let zendeskApiUrl: string;

  before(async () => {
    decache("../../../app");
    decache("../../../middleware/session-middleware");
    const sessionMiddleware = require("../../../middleware/session-middleware");
    sandbox = sinon.createSandbox();
    sandbox
      .stub(sessionMiddleware, "validateSessionMiddleware")
      .callsFake(function (req: any, res: any, next: any): void {
        res.locals.sessionId = "tDy103saszhcxbQq0-mjdzU854";
        req.session.email = "test@test.com";
        req.session.phoneNumber = "******7867";

        next();
      });

    app = await require("../../../app").createApp();
    zendeskApiUrl = process.env.ZENDESK_API_URL;

    request(app)
      .get("/contact-us")
      .query("supportType=PUBLIC")
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

  it("should return contact us page", (done) => {
    request(app)
      .get("/contact-us")
      .query("supportType=PUBLIC")
      .expect(200, done);
  });

  it("should return contact us further information signing in page", (done) => {
    request(app)
      .get("/contact-us-further-information")
      .query("theme=signing_in")
      .expect(200, done);
  });

  it("should return contact us further information account creation page", (done) => {
    request(app)
      .get("/contact-us-further-information")
      .query("theme=account_creation")
      .expect(200, done);
  });

  it("should return contact us questions page with only a theme", (done) => {
    request(app)
      .get("/contact-us-questions")
      .query("theme=email_subscriptions")
      .expect(200, done);
  });

  it("should return contact us questions page with a theme and a subtheme", (done) => {
    request(app)
      .get("/contact-us-questions")
      .query("theme=signing_in")
      .query("subtheme=no_security_code")
      .expect(200, done);
  });

  it("should return error when csrf not present", (done) => {
    request(app)
      .post("/contact-us")
      .query("supportType=PUBLIC")
      .type("form")
      .send({})
      .expect(500, done);
  });

  it("should return validation error when no radio boxes are selected on the signing in contact-us-further-information page", (done) => {
    request(app)
      .post("/contact-us-further-information")
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        theme: "signing_in",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#signing-in-error").text()).to.contains(
          "Select the problem you had when signing in to your account"
        );
      })
      .expect(400, done);
  });

  it("should return validation error when issue description are not entered on the contact-us-questions page", (done) => {
    request(app)
      .post("/contact-us-questions")
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        issueDescription: "",
        theme: "signing_in",
        subtheme: "technical_error",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#issueDescription-error").text()).to.contains(
          "Enter what you were trying to do"
        );
      })
      .expect(400, done);
  });

  it("should return validation error when user selected yes to contact for feedback and left email field empty", (done) => {
    request(app)
      .post("/contact-us-questions")
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        theme: "signing_in",
        subtheme: "something_else",
        issueDescription: "issue",
        additionalDescription: "additional",
        contact: "true",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($("#email-error").text()).to.contains(
          "Enter your email address"
        );
      })
      .expect(400, done);
  });

  it("should redirect to success page when form submitted", (done) => {
    nock(zendeskApiUrl).post("/tickets.json").once().reply(200);

    request(app)
      .post("/contact-us-questions")
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        theme: "signing_in",
        subtheme: "no_security_code",
        optionalDescription: "issue",
        contact: "true",
        email: "test@test.com",
        formType: "noSecurityCode",
      })
      .expect("Location", PATH_NAMES.CONTACT_US_SUBMIT_SUCCESS)
      .expect(302, done);
  });
});
