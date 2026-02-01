-- Allow service role to manage cache tables (for edge function refresh)
CREATE POLICY "Service role can manage popular_schools_cache"
ON public.popular_schools_cache
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage popular_lists_cache"
ON public.popular_lists_cache
FOR ALL
USING (true)
WITH CHECK (true);

-- Also add select policies for public access (read-only for landing page)
CREATE POLICY "Anyone can view popular_schools_cache"
ON public.popular_schools_cache
FOR SELECT
USING (true);

CREATE POLICY "Anyone can view popular_lists_cache"
ON public.popular_lists_cache
FOR SELECT
USING (true);