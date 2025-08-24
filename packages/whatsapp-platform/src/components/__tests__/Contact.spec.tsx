import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { Contact } from '../Contact.js';
import { renderUnitElement } from './utils.js';

it('is a valid Component', () => {
  expect(isNativeType(<Contact name={{ formattedName: 'John' }} />)).toBe(true);
  expect(Contact.$$platform).toBe('whatsapp');
  expect(Contact.$$name).toBe('Contact');
});

test('rendering value', async () => {
  await expect(renderUnitElement(<Contact name={{ formattedName: 'Jane' }} />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Contact
          name={
            {
              "formattedName": "Jane",
            }
          }
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "message": {
            "contact": {
              "addresses": undefined,
              "birthday": undefined,
              "emails": undefined,
              "name": {
                "formatted_name": "Jane",
              },
              "org": undefined,
              "phones": undefined,
              "urls": undefined,
            },
            "context": undefined,
            "type": "contact",
          },
        },
      },
    ]
  `);

  await expect(
    renderUnitElement(
      <Contact
        addresses={[
          {
            type: 'HOME',
            street: 'STREET1',
            city: 'CITY1',
            state: 'STATE1',
            zip: 'ZIP1',
            country: 'COUNTRY1',
            countryCode: 'COUNTRY_CODE1',
          },
          {
            type: 'WORK',
            street: 'STREET2',
            city: 'CITY2',
            state: 'STATE2',
            zip: 'ZIP2',
            country: 'COUNTRY2',
            countryCode: 'COUNTRY_CODE2',
          },
        ]}
        birthday="10-20-30"
        name={{
          formattedName: 'NAME',
          firstName: 'FIRST_NAME',
          lastName: 'LAST_NAME',
          middleName: 'MIDDLE_NAME',
          suffix: 'SUFFIX',
          prefix: 'PREFIX',
        }}
        emails={[
          { type: 'WORK', email: 'EMAIL1' },
          { type: 'HOME', email: 'EMAIL2' },
        ]}
        org={{
          company: 'COMPANY',
          department: 'DEPARTMENT',
          title: 'TITLE',
        }}
        phones={[
          { phone: 'PHONE_NUMBER1', type: 'HOME' },
          { phone: 'PHONE_NUMBER2', type: 'WORK', waId: 'PHONE_OR_WA_ID' },
        ]}
        urls={[
          { url: 'URL1', type: 'WORK' },
          { url: 'URL2', type: 'HOME' },
        ]}
        replyTo="REPLY_TO_MESSAGE_ID"
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Contact
          addresses={
            [
              {
                "city": "CITY1",
                "country": "COUNTRY1",
                "countryCode": "COUNTRY_CODE1",
                "state": "STATE1",
                "street": "STREET1",
                "type": "HOME",
                "zip": "ZIP1",
              },
              {
                "city": "CITY2",
                "country": "COUNTRY2",
                "countryCode": "COUNTRY_CODE2",
                "state": "STATE2",
                "street": "STREET2",
                "type": "WORK",
                "zip": "ZIP2",
              },
            ]
          }
          birthday="10-20-30"
          emails={
            [
              {
                "email": "EMAIL1",
                "type": "WORK",
              },
              {
                "email": "EMAIL2",
                "type": "HOME",
              },
            ]
          }
          name={
            {
              "firstName": "FIRST_NAME",
              "formattedName": "NAME",
              "lastName": "LAST_NAME",
              "middleName": "MIDDLE_NAME",
              "prefix": "PREFIX",
              "suffix": "SUFFIX",
            }
          }
          org={
            {
              "company": "COMPANY",
              "department": "DEPARTMENT",
              "title": "TITLE",
            }
          }
          phones={
            [
              {
                "phone": "PHONE_NUMBER1",
                "type": "HOME",
              },
              {
                "phone": "PHONE_NUMBER2",
                "type": "WORK",
                "waId": "PHONE_OR_WA_ID",
              },
            ]
          }
          replyTo="REPLY_TO_MESSAGE_ID"
          urls={
            [
              {
                "type": "WORK",
                "url": "URL1",
              },
              {
                "type": "HOME",
                "url": "URL2",
              },
            ]
          }
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "message": {
            "contact": {
              "addresses": [
                {
                  "city": "CITY1",
                  "country": "COUNTRY1",
                  "country_code": "COUNTRY_CODE1",
                  "state": "STATE1",
                  "street": "STREET1",
                  "type": "HOME",
                  "zip": "ZIP1",
                },
                {
                  "city": "CITY2",
                  "country": "COUNTRY2",
                  "country_code": "COUNTRY_CODE2",
                  "state": "STATE2",
                  "street": "STREET2",
                  "type": "WORK",
                  "zip": "ZIP2",
                },
              ],
              "birthday": "10-20-30",
              "emails": [
                {
                  "email": "EMAIL1",
                  "type": "WORK",
                },
                {
                  "email": "EMAIL2",
                  "type": "HOME",
                },
              ],
              "name": {
                "first_name": "FIRST_NAME",
                "formatted_name": "NAME",
                "last_name": "LAST_NAME",
                "middle_name": "MIDDLE_NAME",
                "prefix": "PREFIX",
                "suffix": "SUFFIX",
              },
              "org": {
                "company": "COMPANY",
                "department": "DEPARTMENT",
                "title": "TITLE",
              },
              "phones": [
                {
                  "phone": "PHONE_NUMBER1",
                  "type": "HOME",
                },
                {
                  "phone": "PHONE_NUMBER2",
                  "type": "WORK",
                  "wa_id": "PHONE_OR_WA_ID",
                },
              ],
              "urls": [
                {
                  "type": "WORK",
                  "url": "URL1",
                },
                {
                  "type": "HOME",
                  "url": "URL2",
                },
              ],
            },
            "context": {
              "message_id": "REPLY_TO_MESSAGE_ID",
            },
            "type": "contact",
          },
        },
      },
    ]
  `);
});
