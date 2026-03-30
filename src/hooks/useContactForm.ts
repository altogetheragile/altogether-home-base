import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContactFormData } from "@/schemas/contactForm";

const MIN_SUBMIT_TIME_MS = 3000;

export const useContactForm = () => {
  return useMutation({
    mutationFn: async (data: ContactFormData & { _formLoadedAt?: number }) => {
      // Honeypot check — bots fill the hidden website field
      if (data.website) {
        return { success: true };
      }

      // Timestamp check — reject submissions faster than a human can type
      if (data._formLoadedAt && Date.now() - data._formLoadedAt < MIN_SUBMIT_TIME_MS) {
        return { success: true };
      }

      // Strip internal fields before submission
      const { _formLoadedAt, website, ...submitData } = data;

      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(res => res.ip)
        .catch(() => 'unknown');

      let attachmentUrl = null;
      let attachmentFilename = null;
      let attachmentSize = null;
      let attachmentType = null;

      // Handle file upload if present
      if (submitData.attachment) {
        const fileExt = submitData.attachment.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('contact-attachments')
          .upload(filePath, submitData.attachment);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('contact-attachments')
          .getPublicUrl(filePath);

        attachmentUrl = publicUrl;
        attachmentFilename = submitData.attachment.name;
        attachmentSize = submitData.attachment.size;
        attachmentType = submitData.attachment.type;
      }

      // Insert contact record
      const { error: insertError } = await supabase
        .from('contacts')
        .insert({
          full_name: submitData.name,
          email: submitData.email,
          phone: submitData.phone,
          subject: submitData.subject,
          message: submitData.message,
          enquiry_type: submitData.enquiry_type,
          preferred_contact_method: submitData.preferred_contact_method,
          attachment_url: attachmentUrl,
          attachment_filename: attachmentFilename,
          attachment_size: attachmentSize,
          attachment_type: attachmentType,
          ip_address: ipAddress,
          status: 'unread',
        });

      if (insertError) throw insertError;

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: submitData.name,
          email: submitData.email,
          phone: submitData.phone,
          subject: submitData.subject,
          message: submitData.message,
          enquiry_type: submitData.enquiry_type,
          preferred_contact_method: submitData.preferred_contact_method,
        },
      });

      if (emailError) {
        // Don't throw - contact was saved successfully
      }

      return { success: true };
    },
    onSuccess: () => {
      toast.success("Message sent successfully! We'll get back to you soon.");
    },
    onError: (error: Error) => {
      if (error.message?.includes('Rate limit exceeded')) {
        toast.error("Please wait 5 minutes before submitting another message.");
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    },
  });
};
