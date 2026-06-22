
CREATE TABLE public.admin_task_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  file_size bigint,
  task_id uuid REFERENCES public.admin_tasks(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_task_documents TO authenticated;
GRANT ALL ON public.admin_task_documents TO service_role;

ALTER TABLE public.admin_task_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read documents"
  ON public.admin_task_documents FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins insert documents"
  ON public.admin_task_documents FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND uploaded_by = auth.uid());

CREATE POLICY "Admins update documents"
  ON public.admin_task_documents FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete documents"
  ON public.admin_task_documents FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX idx_admin_task_documents_task ON public.admin_task_documents(task_id);

-- Storage policies for bucket "admin-documents" (bucket created via tool)
CREATE POLICY "Admins read admin-documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'admin-documents' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins upload admin-documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'admin-documents' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins update admin-documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'admin-documents' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'admin-documents' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins delete admin-documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'admin-documents' AND public.is_admin(auth.uid()));
