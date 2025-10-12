import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be less than 100 characters" }),
  
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  
  phone: z.string().optional(),
  
  subject: z
    .string()
    .trim()
    .min(5, { message: "Subject must be at least 5 characters" })
    .max(200, { message: "Subject must be less than 200 characters" }),
  
  message: z
    .string()
    .trim()
    .min(10, { message: "Message must be at least 10 characters" })
    .max(2000, { message: "Message must be less than 2000 characters" }),
  
  enquiry_type: z.enum(["general", "support", "partnership", "feedback"]),
  
  preferred_contact_method: z.enum(["email", "phone"]).optional(),
  
  attachment: z.instanceof(File).optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
