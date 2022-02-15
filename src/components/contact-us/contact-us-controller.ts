import { Request, Response } from "express";
import { PATH_NAMES, SUPPORT_TYPE, ZENDESK_THEMES } from "../../app.constants";
import { contactUsService } from "./contact-us-service";
import { ContactUsServiceInterface, Questions } from "./types";
import { ExpressRouteFunc } from "../../types";

const themeToPageTitle = {
  [ZENDESK_THEMES.ACCOUNT_NOT_FOUND]:
    "pages.contactUsQuestions.accountNotFound.title",
  [ZENDESK_THEMES.TECHNICAL_ERROR]:
    "pages.contactUsQuestions.technicalError.title",
  [ZENDESK_THEMES.NO_SECURITY_CODE]:
    "pages.contactUsQuestions.noSecurityCode.title",
  [ZENDESK_THEMES.INVALID_SECURITY_CODE]:
    "pages.contactUsQuestions.invalidSecurityCode.title",
  [ZENDESK_THEMES.NO_UK_MOBILE_NUMBER]:
    "pages.contactUsQuestions.noUKMobile.title",
  [ZENDESK_THEMES.FORGOTTEN_PASSWORD]:
    "pages.contactUsQuestions.forgottenPassword.title",
  [ZENDESK_THEMES.NO_PHONE_NUMBER_ACCESS]:
    "pages.contactUsQuestions.noPhoneNumberAccess.title",
  [ZENDESK_THEMES.EMAIL_SUBSCRIPTIONS]:
    "pages.contactUsQuestions.emailSubscriptions.title",
  [ZENDESK_THEMES.SOMETHING_ELSE]:
    "pages.contactUsQuestions.anotherProblem.title",
  [ZENDESK_THEMES.SUGGESTIONS_FEEDBACK]:
    "pages.contactUsQuestions.suggestionOrFeedback.title",
};

const somethingElseSubThemeToPageTitle = {
  [ZENDESK_THEMES.ACCOUNT_CREATION]:
    "pages.contactUsQuestions.accountCreation.title",
  [ZENDESK_THEMES.SIGNING_IN]: "pages.contactUsQuestions.signingIn.title",
};

export function contactUsGet(req: Request, res: Response): void {
  if (req.query.supportType === SUPPORT_TYPE.GOV_SERVICE) {
    return res.render("contact-us/index-gov-service-contact-us.njk");
  }

  return res.render("contact-us/index-public-contact-us.njk");
}

export function contactUsFormPost(req: Request, res: Response): void {
  let url = PATH_NAMES.CONTACT_US_QUESTIONS;
  const queryParams = new URLSearchParams({ theme: req.body.theme }).toString();
  if (
    [ZENDESK_THEMES.ACCOUNT_CREATION, ZENDESK_THEMES.SIGNING_IN].includes(
      req.body.theme
    )
  ) {
    url = PATH_NAMES.CONTACT_US_FURTHER_INFORMATION;
  }
  res.redirect(url + "?" + queryParams);
}

export function furtherInformationGet(req: Request, res: Response): void {
  return res.render("contact-us/further-information/index.njk", {
    theme: req.query.theme,
  });
}

export function furtherInformationPost(req: Request, res: Response): void {
  const url = PATH_NAMES.CONTACT_US_QUESTIONS;
  const queryParams = new URLSearchParams({
    theme: req.body.theme,
    subtheme: req.body.subtheme,
  }).toString();

  res.redirect(url + "?" + queryParams);
}

export function contactUsQuestionsGet(req: Request, res: Response): void {
  let pageTitle = themeToPageTitle[req.query.theme as string];
  if (
    req.query.subtheme === ZENDESK_THEMES.SOMETHING_ELSE &&
    req.query.theme === ZENDESK_THEMES.ACCOUNT_CREATION
  ) {
    pageTitle = somethingElseSubThemeToPageTitle[req.query.theme as string];
  } else if (req.query.subtheme) {
    pageTitle = themeToPageTitle[req.query.subtheme as string];
  }
  return res.render("contact-us/questions/index.njk", {
    theme: req.query.theme,
    subtheme: req.query.subtheme,
    backurl: req.headers.referer,
    pageTitleHeading: pageTitle,
  });
}

export function contactUsQuestionsFormPost(
  service: ContactUsServiceInterface = contactUsService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const listofquestions = getQuestionsFromFormType(req, req.body.formType);

    await service.contactUsSubmitForm({
      descriptions: {
        issueDescription: req.body.issueDescription,
        additionalDescription: req.body.additionalDescription,
        optionalDescription: req.body.optionalDescription,
      },
      themes: { theme: req.body.theme, subtheme: req.body.subtheme },
      subject: "GOV.UK Accounts Feedback",
      email: req.body.email,
      name: req.body.name,
      optionalData: {
        sessionId: res.locals.sessionId,
        userAgent: req.get("User-Agent"),
      },
      feedbackContact: req.body.contact === "true",
      questions: listofquestions,
    });

    return res.redirect(PATH_NAMES.CONTACT_US_SUBMIT_SUCCESS);
  };
}

export function contactUsSubmitSuccessGet(req: Request, res: Response): void {
  res.render("contact-us/index-submit-success.njk");
}

export function getQuestionsFromFormType(
  req: Request,
  formType: string
): Questions {
  const formTypeToQuestions: { [key: string]: any } = {
    accountCreationProblem: {
      issueDescription: req.t(
        "pages.contactUsQuestions.accountCreationProblem.section1.paragraph1"
      ),
    },
    accountNotFound: {
      issueDescription: req.t(
        "pages.contactUsQuestions.accountNotFound.section1.header"
      ),
      optionalDescription: req.t(
        "pages.contactUsQuestions.accountNotFound.section2.header"
      ),
    },
    anotherProblem: {
      issueDescription: req.t(
        "pages.contactUsQuestions.anotherProblem.section1.header"
      ),
      additionalDescription: req.t(
        "pages.contactUsQuestions.anotherProblem.section2.header"
      ),
    },
    emailSubscription: {
      issueDescription: req.t(
        "pages.contactUsQuestions.emailSubscriptions.section1.header"
      ),
      optionalDescription: req.t(
        "pages.contactUsQuestions.emailSubscriptions.section2.header"
      ),
    },
    forgottenPassword: {
      optionalDescription: req.t(
        "pages.contactUsQuestions.forgottenPassword.section1.header"
      ),
    },
    invalidSecurityCode: {
      optionalDescription: req.t(
        "pages.contactUsQuestions.invalidSecurityCode.section1.header"
      ),
    },
    noPhoneNumberAccess: {
      optionalDescription: req.t(
        "pages.contactUsQuestions.noPhoneNumberAccess.section1.header"
      ),
    },
    noSecurityCode: {
      optionalDescription: req.t(
        "pages.contactUsQuestions.noSecurityCode.section1.header"
      ),
    },
    noUKMobile: {
      optionalDescription: req.t(
        "pages.contactUsQuestions.noUKMobile.section1.header"
      ),
    },
    signingInProblem: {
      issueDescription: req.t(
        "pages.contactUsQuestions.signignInProblem.section1.header"
      ),
    },
    suggestionFeedback: {
      issueDescription: req.t(
        "pages.contactUsQuestions.suggestionOrFeedback.section1.header"
      ),
    },
    technicalError: {
      issueDescription: req.t(
        "pages.contactUsQuestions.technicalError.section1.header"
      ),
      additionalDescription: req.t(
        "pages.contactUsQuestions.technicalError.section2.header"
      ),
      optionalDescription: req.t(
        "pages.contactUsQuestions.technicalError.section3.header"
      ),
    },
  };

  return formTypeToQuestions[formType];
}
