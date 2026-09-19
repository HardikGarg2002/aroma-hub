-- Checkout: payment + coupon details on orders, and generated order numbers.
-- Safe to re-run.

alter table public.orders
  add column if not exists coupon_code       text,
  add column if not exists payment_provider  text,
  add column if not exists payment_reference text;

-- One order per PayPal payment: capture is retried safely by looking this up.
create unique index if not exists orders_payment_reference_key
  on public.orders (payment_reference)
  where payment_reference is not null;

-- Human-facing order numbers: AR-1001, AR-1002, ...
create sequence if not exists public.order_number_seq start 1001;
alter table public.orders
  alter column order_number set default ('AR-' || nextval('public.order_number_seq'));
