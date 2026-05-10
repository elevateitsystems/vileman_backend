import * as v from 'valibot';

export const CheckoutSchema = v.object({
    products: v.array(
        v.object({
            productId: v.pipe(v.string(), v.uuid()),
            quantity: v.pipe(v.number(), v.minValue(1)),
        })
    ),
    customerEmail: v.pipe(v.string(), v.email()),
    customerPhone: v.string(),
    shippingCountry: v.string(),
});

export type CheckoutInput = v.InferOutput<typeof CheckoutSchema>;
