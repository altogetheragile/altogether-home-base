-- Allow users to delete their own event registrations
CREATE POLICY "Users can delete own registrations" 
ON public.event_registrations 
FOR DELETE 
USING (auth.uid() = user_id);