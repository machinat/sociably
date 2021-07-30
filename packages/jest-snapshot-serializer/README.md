# Jest Snapshot Serializer

Format Machinat JSX elements in the [jest snapshot](https://jestjs.io/docs/snapshot-testing).

## Install

```bash
npm install @machinat/jest-snapshot-serializer
# or with yarn
yarn add @machinat/jest-snapshot-serializer
```

## Setup

Add the serializer to into `jest.config.js`:

```js
module.exports = {
  // ...
  snapshotSerializers: ['@machinat/jest-snapshot-serializer'],
};
```

Or `packages.json`:

```json
{
  "name": "my-project",
  "jest": {
    "snapshotSerializers": ["@machinat/jest-snapshot-serializer"],
  }
}
```

## Example

```js
expect(
  <GenericTemplate imageAspectRatio="square" sharable>
    <GenericItem
      title="foo"
      imageUrl="http://foo.bar/image"
      buttons={<UrlButton title="check" url="http://xxx.yy.z" />}
    />
  </GenericTemplate>
).toMatchInlineSnapshot(`
  <GenericTemplate
    imageAspectRatio="square"
    sharable={true}
  >
    <GenericItem
      buttons={
        <UrlButton
          title="check"
          url="http://xxx.yy.z"
        />
      }
      imageUrl="http://foo.bar/image"
      title="foo"
    />
  </GenericTemplate>
`);
```
