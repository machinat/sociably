import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { renderUnitElement } from './utils';
import { ReceiptTemplate, ReceiptItem } from '../ReceiptTemplate';

it('is valid component', () => {
  expect(typeof ReceiptItem).toBe('function');
  expect(typeof ReceiptTemplate).toBe('function');
  expect(isNativeType(<ReceiptItem title="" price={0} />)).toBe(true);
  expect(isNativeType(<ReceiptTemplate {...({} as any)} />)).toBe(true);
  expect(ReceiptItem.$$platform).toBe('facebook');
  expect(ReceiptTemplate.$$platform).toBe('facebook');
});

it('match snapshot', async () => {
  await expect(
    renderUnitElement(
      <ReceiptTemplate
        recipientName="John Doe"
        orderNumber="12345"
        currency="USD"
        paymentMethod="Visa 2345"
        orderUrl="http://what.a.shop"
        summary={{ total_cost: 56.14 }}
      >
        <ReceiptItem title="Woody" price={9.99} />
      </ReceiptTemplate>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <ReceiptTemplate
                currency="USD"
                orderNumber="12345"
                orderUrl="http://what.a.shop"
                paymentMethod="Visa 2345"
                recipientName="John Doe"
                summary={
                  Object {
                    "total_cost": 56.14,
                  }
                }
              >
                <ReceiptItem
                  price={9.99}
                  title="Woody"
                />
              </ReceiptTemplate>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "apiPath": "me/messages",
                "params": Object {
                  "message": Object {
                    "attachment": Object {
                      "payload": Object {
                        "address": undefined,
                        "adjustments": undefined,
                        "currency": "USD",
                        "elements": Array [
                          Object {
                            "currency": undefined,
                            "image_url": undefined,
                            "price": 9.99,
                            "quantity": undefined,
                            "subtitle": undefined,
                            "title": "Woody",
                          },
                        ],
                        "merchant_name": undefined,
                        "order_number": "12345",
                        "order_url": "http://what.a.shop",
                        "payment_method": "Visa 2345",
                        "recipient_name": "John Doe",
                        "sharable": undefined,
                        "summary": Object {
                          "total_cost": 56.14,
                        },
                        "template_type": "receipt",
                        "timestamp": undefined,
                      },
                      "type": "template",
                    },
                  },
                },
                "type": "message",
              },
            },
          ]
        `);
  await expect(
    renderUnitElement(
      <ReceiptTemplate
        recipientName="John Doe"
        orderNumber="12345"
        currency="USD"
        paymentMethod="Visa 2345"
        orderUrl="http://what.a.shop"
        summary={{ total_cost: 56.14 }}
      >
        <ReceiptItem title="Woody" price={9.99} />
        <ReceiptItem title="Buzz Lightyear" price={9.99} />
        <ReceiptItem title="Slinky Dog" price={9.99} />
      </ReceiptTemplate>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <ReceiptTemplate
                currency="USD"
                orderNumber="12345"
                orderUrl="http://what.a.shop"
                paymentMethod="Visa 2345"
                recipientName="John Doe"
                summary={
                  Object {
                    "total_cost": 56.14,
                  }
                }
              >
                <ReceiptItem
                  price={9.99}
                  title="Woody"
                />
                <ReceiptItem
                  price={9.99}
                  title="Buzz Lightyear"
                />
                <ReceiptItem
                  price={9.99}
                  title="Slinky Dog"
                />
              </ReceiptTemplate>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "apiPath": "me/messages",
                "params": Object {
                  "message": Object {
                    "attachment": Object {
                      "payload": Object {
                        "address": undefined,
                        "adjustments": undefined,
                        "currency": "USD",
                        "elements": Array [
                          Object {
                            "currency": undefined,
                            "image_url": undefined,
                            "price": 9.99,
                            "quantity": undefined,
                            "subtitle": undefined,
                            "title": "Woody",
                          },
                          Object {
                            "currency": undefined,
                            "image_url": undefined,
                            "price": 9.99,
                            "quantity": undefined,
                            "subtitle": undefined,
                            "title": "Buzz Lightyear",
                          },
                          Object {
                            "currency": undefined,
                            "image_url": undefined,
                            "price": 9.99,
                            "quantity": undefined,
                            "subtitle": undefined,
                            "title": "Slinky Dog",
                          },
                        ],
                        "merchant_name": undefined,
                        "order_number": "12345",
                        "order_url": "http://what.a.shop",
                        "payment_method": "Visa 2345",
                        "recipient_name": "John Doe",
                        "sharable": undefined,
                        "summary": Object {
                          "total_cost": 56.14,
                        },
                        "template_type": "receipt",
                        "timestamp": undefined,
                      },
                      "type": "template",
                    },
                  },
                },
                "type": "message",
              },
            },
          ]
        `);
  await expect(
    renderUnitElement(
      <ReceiptTemplate
        sharable
        recipientName="John Doe"
        merchantName="AI"
        orderNumber="12345"
        currency="USD"
        paymentMethod="Visa 2345"
        orderUrl="http://what.a.shop"
        timestamp="1428444852"
        address={{
          street_1: '1 Hacker Way',
          street_2: 'Somewhere...',
          city: 'Menlo Park',
          postal_code: '94025',
          state: 'CA',
          country: 'US',
        }}
        summary={{
          subtotal: 75.0,
          shipping_cost: 4.95,
          total_tax: 6.19,
          total_cost: 56.14,
        }}
        adjustments={[
          { name: 'New Customer Discount', amount: 20 },
          { name: '$10 Off Coupon', amount: 10 },
        ]}
      >
        <ReceiptItem
          title="A robot!"
          subtitle="It's real!"
          quantity={999}
          price={99.99}
          currency="USD"
          imageUrl="http://i.robot/avatar"
        />
      </ReceiptTemplate>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <ReceiptTemplate
                address={
                  Object {
                    "city": "Menlo Park",
                    "country": "US",
                    "postal_code": "94025",
                    "state": "CA",
                    "street_1": "1 Hacker Way",
                    "street_2": "Somewhere...",
                  }
                }
                adjustments={
                  Array [
                    Object {
                      "amount": 20,
                      "name": "New Customer Discount",
                    },
                    Object {
                      "amount": 10,
                      "name": "$10 Off Coupon",
                    },
                  ]
                }
                currency="USD"
                merchantName="AI"
                orderNumber="12345"
                orderUrl="http://what.a.shop"
                paymentMethod="Visa 2345"
                recipientName="John Doe"
                sharable={true}
                summary={
                  Object {
                    "shipping_cost": 4.95,
                    "subtotal": 75,
                    "total_cost": 56.14,
                    "total_tax": 6.19,
                  }
                }
                timestamp="1428444852"
              >
                <ReceiptItem
                  currency="USD"
                  imageUrl="http://i.robot/avatar"
                  price={99.99}
                  quantity={999}
                  subtitle="It's real!"
                  title="A robot!"
                />
              </ReceiptTemplate>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "apiPath": "me/messages",
                "params": Object {
                  "message": Object {
                    "attachment": Object {
                      "payload": Object {
                        "address": Object {
                          "city": "Menlo Park",
                          "country": "US",
                          "postal_code": "94025",
                          "state": "CA",
                          "street_1": "1 Hacker Way",
                          "street_2": "Somewhere...",
                        },
                        "adjustments": Array [
                          Object {
                            "amount": 20,
                            "name": "New Customer Discount",
                          },
                          Object {
                            "amount": 10,
                            "name": "$10 Off Coupon",
                          },
                        ],
                        "currency": "USD",
                        "elements": Array [
                          Object {
                            "currency": "USD",
                            "image_url": "http://i.robot/avatar",
                            "price": 99.99,
                            "quantity": 999,
                            "subtitle": "It's real!",
                            "title": "A robot!",
                          },
                        ],
                        "merchant_name": "AI",
                        "order_number": "12345",
                        "order_url": "http://what.a.shop",
                        "payment_method": "Visa 2345",
                        "recipient_name": "John Doe",
                        "sharable": true,
                        "summary": Object {
                          "shipping_cost": 4.95,
                          "subtotal": 75,
                          "total_cost": 56.14,
                          "total_tax": 6.19,
                        },
                        "template_type": "receipt",
                        "timestamp": "1428444852",
                      },
                      "type": "template",
                    },
                  },
                },
                "type": "message",
              },
            },
          ]
        `);
});

it('accept Date object for timestamp prop', async () => {
  const segsA = await renderUnitElement(
    <ReceiptTemplate timestamp={new Date(1535622297000)} {...({} as any)} />
  );
  const segsB = await renderUnitElement(
    <ReceiptTemplate timestamp="1535622297" {...({} as any)} />
  );
  expect(segsA?.[0].value).toEqual(segsB?.[0].value);
});
