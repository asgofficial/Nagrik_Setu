import emailjs from '@emailjs/browser';

interface SendEmailParams {
  toEmail?: string;
  toName?: string;
  subject: string;
  message: string;
  formType: 'report' | 'registration' | 'login' | 'general';
  details?: Record<string, unknown>;
}

/**
 * Sends an email notification using EmailJS.
 * Handles both live EmailJS sending when credentials are provided,
 * and graceful local console logging / simulation when keys are not configured.
 */
export async function sendEmailNotification(params: SendEmailParams): Promise<{ success: boolean; message: string }> {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  const templateParams = {
    to_email: params.toEmail || 'citizen@nagriksetu.gov.in',
    to_name: params.toName || 'Nagrik User',
    subject: params.subject,
    message: params.message,
    form_type: params.formType,
    details: JSON.stringify(params.details || {}, null, 2),
    timestamp: new Date().toLocaleString()
  };

  if (serviceId && templateId && publicKey) {
    try {
      const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
      console.log('EmailJS Notification Sent Successfully:', response.status, response.text);
      return { success: true, message: 'Email sent successfully via EmailJS!' };
    } catch (error: unknown) {
      console.error('EmailJS Send Error:', error);
      return { success: false, message: 'Failed to send email via EmailJS.' };
    }
  } else {
    // Graceful fallback logging when EmailJS credentials are not yet set
    console.log('📧 [EmailJS Simulation Mode] Email Notification Details:', templateParams);
    return { 
      success: true, 
      message: 'Email notification processed (Simulation Mode: Configure NEXT_PUBLIC_EMAILJS_* keys in .env.local for live delivery).' 
    };
  }
}
