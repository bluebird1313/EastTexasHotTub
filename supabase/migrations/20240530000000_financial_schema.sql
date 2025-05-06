-- Create financial_invoices table
CREATE TABLE IF NOT EXISTS public.financial_invoices (
  id BIGSERIAL PRIMARY KEY,
  qb_id TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  document_number TEXT,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  item_name TEXT,
  item_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.financial_invoices ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX IF NOT EXISTS financial_invoices_date_idx ON public.financial_invoices (date);
CREATE INDEX IF NOT EXISTS financial_invoices_item_type_idx ON public.financial_invoices (item_type);

-- Create stored function for executing dynamic SQL queries
CREATE OR REPLACE FUNCTION public.execute_query(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE sql_query INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Create common queries as functions
CREATE OR REPLACE FUNCTION public.get_hot_tub_revenue_last_month()
RETURNS TABLE (revenue DECIMAL)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT SUM(amount) as revenue
  FROM financial_invoices
  WHERE item_type = 'Hot Tub' 
  AND date >= date_trunc('month', current_date - interval '1 month')
  AND date < date_trunc('month', current_date);
$$;

-- Function to get revenue by product type
CREATE OR REPLACE FUNCTION public.get_revenue_by_product_type(
  start_date DATE DEFAULT date_trunc('month', current_date - interval '1 month')::DATE,
  end_date DATE DEFAULT date_trunc('month', current_date)::DATE
)
RETURNS TABLE (item_type TEXT, revenue DECIMAL)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    item_type,
    SUM(amount) as revenue
  FROM financial_invoices
  WHERE date >= start_date AND date < end_date
  GROUP BY item_type
  ORDER BY revenue DESC;
$$; 