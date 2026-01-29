import nodemailer from "nodemailer";
import config from "../config/env.js";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});

async function sendEmail({ to, subject, body }) {
  const mailOptions = {
    from: config.SMTP_USER,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject: subject,
    text: body,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("SMTP sendEmail error", error);
    return false;
  }
}

async function sendCustomerAcknowledgement(email, name) {
  const subject = "We received your inquiry";
  const body = [
    `Hi ${name},`,
    "",
    "Thanks for reaching out. Your inquiry has been received and our team will review it shortly.",
    "We will follow up if we need more details.",
    "",
    "Best regards,",
    "Customer Support",
  ].join("\n");

  return sendEmail({ to: email, subject, body });
}

async function sendAdminAlert(inquiry) {
  const subject = "New high-priority customer inquiry";
  const body = [
    "A high-priority inquiry was submitted.",
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    `Intent: ${inquiry.intent}`,
    `Sentiment: ${inquiry.sentiment}`,
    `Urgency: ${inquiry.urgency}`,
    `Priority: ${inquiry.priority}`,
    "",
    "Message:",
    inquiry.message,
  ].join("\n");

  return sendEmail({ to: config.SMTP_USER, subject, body });
}

async function sendFollowUpReminder(inquiry) {
  const subject = "Follow-up on your inquiry";
  const body = [
    `Hi ${inquiry.name},`,
    "",
    "Our support team is currently reviewing your request and will get back to you shortly.",
    "We appreciate your patience.",
    "",
    "If your issue has already been resolved, you can ignore this message.",
    "",
    "Thank you for your patience.",
    "Customer Support",
  ].join("\n");

  return sendEmail({ to: inquiry.email, subject, body });
}

export { sendCustomerAcknowledgement, sendAdminAlert, sendFollowUpReminder };
