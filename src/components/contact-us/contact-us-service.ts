import {
  ContactForm,
  ContactUsServiceInterface,
  Descriptions,
  OptionalData,
  Questions,
  Themes,
} from "./types";
import { defaultZendeskClient } from "../../utils/zendesk";
import { getZendeskGroupIdPublic } from "../../config";
import { CreateTicketPayload, ZendeskInterface } from "../../utils/types";

export function contactUsService(
  zendeskClient: ZendeskInterface = defaultZendeskClient
): ContactUsServiceInterface {
  const contactUsSubmitForm = async function (
    contactForm: ContactForm
  ): Promise<void> {
    const payload: CreateTicketPayload = {
      ticket: {
        subject: contactForm.subject,
        comment: {
          html_body: formatCommentBody(
            contactForm.descriptions,
            contactForm.optionalData,
            contactForm.questions,
            contactForm.themes
          ),
        },
        group_id: getZendeskGroupIdPublic(),
        tags: ["govuk_sign_in", ...prefixThemeTags(contactForm.themes)],
      },
    };

    if (contactForm.feedbackContact && contactForm.email) {
      payload.ticket.requester = {
        email: contactForm.email,
        name: contactForm.name,
      };
    }

    await zendeskClient.createTicket(payload);
  };

  function formatCommentBody(
    descriptions: Descriptions,
    optionalData: OptionalData,
    questions: Questions,
    themes: Themes
  ) {
    const htmlBody = [];

    htmlBody.push(`<span>[What are you contacting us about?]</span>`);
    htmlBody.push(`<p>${themes.theme}</p>`);

    if (themes.subtheme) {
      htmlBody.push(`<span>[Tell us what happened?]</span>`);
      htmlBody.push(`<p>${themes.subtheme}</p>`);
    }

    if (descriptions.issueDescription) {
      htmlBody.push(`<span>[${questions.issueDescription}]</span>`);
      htmlBody.push(`<p>${descriptions.issueDescription}</p>`);
    }

    if (descriptions.additionalDescription) {
      htmlBody.push(`<span>[${questions.additionalDescription}]</span>`);
      htmlBody.push(`<p>${descriptions.additionalDescription}</p>`);
    }

    if (descriptions.optionalDescription) {
      htmlBody.push(`<span>[${questions.optionalDescription}]</span>`);
      htmlBody.push(`<p>${descriptions.optionalDescription}</p>`);
    }

    htmlBody.push(`<span>[Session ID]</span>`);
    htmlBody.push(`<p>${optionalData.sessionId}</p>`);

    htmlBody.push(`<span>[User Agent]</span>`);
    htmlBody.push(`<p>${optionalData.userAgent}</p>`);

    return htmlBody.join("");
  }

  function prefixThemeTags(themes: Themes) {
    const tagPrefix = "auth_";
    const tagArray = [];
    tagArray.push(tagPrefix + themes.theme);
    if (themes.subtheme) {
      tagArray.push(tagPrefix + themes.subtheme);
    }
    return tagArray;
  }

  return {
    contactUsSubmitForm,
  };
}
