-- Add unique constraint on (user_id, apartment_id) so each user has at most 1 simulation per apartment
ALTER TABLE public.budget_simulations
  ADD CONSTRAINT budget_simulations_user_apartment_unique UNIQUE (user_id, apartment_id);