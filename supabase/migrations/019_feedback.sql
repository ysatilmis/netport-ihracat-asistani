CREATE TABLE feedback (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rating     INTEGER CHECK (rating >= 1 AND rating <= 5),
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can insert feedback"
  ON feedback FOR INSERT WITH CHECK (true);

CREATE POLICY "service role reads feedback"
  ON feedback FOR SELECT USING (auth.role() = 'service_role');
