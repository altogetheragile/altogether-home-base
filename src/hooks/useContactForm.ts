import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContactFormData } from "@/schemas/contactForm";

export const useContactForm = () => {
  return useMutation({
    mutationFn: async (data: ContactFormData) => {
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => 'unknown');

      let attachmentUrl = null;
      let attachmentFilename = null;
      let attachmentSize = null;
      let attachmentType = null;

      // Handle file upload if present
      if (data.attachment) {
        const fileExt = data.attachment.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('contact-attachments')
          .upload(filePath, data.attachment);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('contact-attachments')
          .getPublicUrl(filePath);

        attachmentUrl = publicUrl;
        attachmentFilename = data.attachment.name;
        attachmentSize = data.attachment.size;
        attachmentType = data.attachment.type;
      }

      // Insert contact record
      const { error: insertError } = await supabase
        .from('contacts')
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone,
          subject: data.subject,
          message: data.message,
          enquiry_type: data.enquiry_type,
          preferred_contact_method: data.preferred_contact_method,
          attachment_url: attachmentUrl,
          attachment_filename: attachmentFilename,
          attachment_size: attachmentSize,
          attachment_type: attachmentType,
          ip_address: ipAddress,
          status: 'new',
        });

      if (insertError) throw insertError;

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          subject: data.subject,
          message: data.message,
          enquiry_type: data.enquiry_type,
          preferred_contact_method: data.preferred_contact_method,
        },
      });

      if (emailError) {
        console.error('Email notification failed:', emailError);
        // Don't throw - contact was saved successfully
      }

      return { success: true };
    },
    onSuccess: () => {
      toast.success("Message sent successfully! We'll get back to you soon.");
    },
    onError: (error: any) => {
      if (error.message?.includes('Rate limit exceeded')) {
        toast.error("Please wait 5 minutes before submitting another message.");
      } else {
        toast.error("Failed to send message. Please try again.");
      }
      console.error('Contact form error:', error);
    },
  });
};
